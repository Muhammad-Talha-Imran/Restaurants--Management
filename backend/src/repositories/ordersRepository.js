const { query, withTransaction } = require('../config/database');

// Allowed status lifecycle transitions
const ALLOWED_TRANSITIONS = {
  placed: ['preparing', 'cancelled'],
  preparing: ['served', 'cancelled'],
  served: ['billed'],
  billed: [],
  cancelled: []
};

const ordersRepository = {
  /**
   * Find orders with filters, joins, and pagination
   */
  async findAll({
    status,
    table_id,
    staff_id,
    order_type,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 50
  } = {}) {
    let baseSql = `
      FROM orders o
      LEFT JOIN restaurant_tables t ON o.table_id = t.table_id
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      baseSql += ' AND o.order_status = ?';
      params.push(status);
    }
    if (table_id) {
      baseSql += ' AND o.table_id = ?';
      params.push(parseInt(table_id, 10));
    }
    if (staff_id) {
      baseSql += ' AND o.staff_id = ?';
      params.push(parseInt(staff_id, 10));
    }
    if (order_type) {
      baseSql += ' AND o.order_type = ?';
      params.push(order_type);
    }
    if (startDate) {
      baseSql += ' AND DATE(o.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      baseSql += ' AND DATE(o.created_at) <= ?';
      params.push(endDate);
    }
    if (search && search.trim() !== '') {
      baseSql += ' AND (o.order_number LIKE ? OR c.full_name LIKE ? OR s.full_name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const countSql = `SELECT COUNT(DISTINCT o.order_id) AS total ${baseSql}`;
    const countRows = await query(countSql, params);
    const total = countRows[0].total;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, parseInt(limit, 10) || 50);
    const offset = (p - 1) * l;

    const dataSql = `
      SELECT 
        o.order_id,
        o.order_number,
        o.table_id,
        t.table_number,
        t.location_notes,
        o.staff_id,
        s.full_name AS staff_name,
        o.customer_id,
        c.full_name AS customer_name,
        c.phone AS customer_phone,
        o.order_type,
        o.order_status,
        o.subtotal,
        o.tax_amount,
        o.discount_amount,
        o.final_amount,
        o.notes,
        o.created_at,
        o.updated_at,
        p.payment_id,
        p.payment_status,
        p.payment_method,
        p.amount_paid,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS total_items_count
      ${baseSql}
      ORDER BY o.created_at DESC
      LIMIT ${l} OFFSET ${offset}
    `;

    const orders = await query(dataSql, params);

    return {
      orders,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    };
  },

  /**
   * Find order by ID with all item lines, pricing, and payment details
   */
  async findById(orderId) {
    const orderSql = `
      SELECT 
        o.order_id,
        o.order_number,
        o.table_id,
        t.table_number,
        t.capacity AS table_capacity,
        t.status AS table_status,
        t.location_notes,
        o.staff_id,
        s.full_name AS staff_name,
        s.role AS staff_role,
        o.customer_id,
        c.full_name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        o.order_type,
        o.order_status,
        o.subtotal,
        o.tax_amount,
        o.discount_amount,
        o.final_amount,
        o.notes,
        o.created_at,
        o.updated_at,
        p.payment_id,
        p.payment_status,
        p.payment_method,
        p.amount_paid,
        p.payment_time,
        p.transaction_reference
      FROM orders o
      LEFT JOIN restaurant_tables t ON o.table_id = t.table_id
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      WHERE o.order_id = ?
    `;
    const orderRows = await query(orderSql, [orderId]);
    if (orderRows.length === 0) return null;

    const order = orderRows[0];

    // Fetch order items with item names and category names
    const itemsSql = `
      SELECT 
        oi.order_item_id,
        oi.order_id,
        oi.item_id,
        m.name AS item_name,
        c.name AS category_name,
        oi.quantity,
        oi.unit_price,
        oi.subtotal,
        oi.special_instructions,
        oi.status,
        oi.created_at
      FROM order_items oi
      INNER JOIN menu_items m ON oi.item_id = m.item_id
      INNER JOIN categories c ON m.category_id = c.category_id
      WHERE oi.order_id = ?
      ORDER BY oi.order_item_id ASC
    `;
    order.items = await query(itemsSql, [orderId]);

    // Fetch order status history audit log
    const historySql = `
      SELECT history_id, old_status, new_status, changed_at, notes
      FROM order_status_history
      WHERE order_id = ?
      ORDER BY changed_at ASC
    `;
    order.status_history = await query(historySql, [orderId]);

    return order;
  },

  /**
   * Create an Order with Items in a single ACID Transaction
   */
  async createWithItems({
    table_id = null,
    staff_id,
    customer_id = null,
    order_type = 'dine_in',
    notes = null,
    items = [],
    tax_rate = 5.0,
    discount_amount = 0.00
  }) {
    if (!items || items.length === 0) {
      const error = new Error('Order must contain at least one menu item.');
      error.statusCode = 400;
      throw error;
    }

    return await withTransaction(async (conn) => {
      // 1. If dine-in, verify table exists and is active
      if (order_type === 'dine_in') {
        if (!table_id) {
          const error = new Error('Table is required for dine-in orders.');
          error.statusCode = 400;
          throw error;
        }

        const [tables] = await conn.execute(
          'SELECT table_id, status, is_active FROM restaurant_tables WHERE table_id = ? FOR UPDATE',
          [table_id]
        );

        if (tables.length === 0 || !tables[0].is_active) {
          const error = new Error('Selected table is invalid or inactive.');
          error.statusCode = 400;
          throw error;
        }
      }

      // 2. Fetch current prices directly from database to prevent browser price manipulation
      const itemIds = items.map((i) => i.item_id);
      const placeholders = itemIds.map(() => '?').join(',');
      const [menuRows] = await conn.execute(
        `SELECT item_id, name, price, is_available FROM menu_items WHERE item_id IN (${placeholders})`,
        itemIds
      );

      const menuMap = new Map();
      menuRows.forEach((m) => menuMap.set(m.item_id, m));

      let computedSubtotal = 0.00;
      const verifiedItems = [];

      for (const reqItem of items) {
        const menuItem = menuMap.get(reqItem.item_id);
        if (!menuItem) {
          const error = new Error(`Menu item ID ${reqItem.item_id} not found in database.`);
          error.statusCode = 400;
          throw error;
        }
        if (!menuItem.is_available) {
          const error = new Error(`Menu item '${menuItem.name}' is currently marked unavailable.`);
          error.statusCode = 400;
          throw error;
        }

        const qty = parseInt(reqItem.quantity, 10);
        if (isNaN(qty) || qty <= 0) {
          const error = new Error(`Invalid quantity (${reqItem.quantity}) for item '${menuItem.name}'.`);
          error.statusCode = 400;
          throw error;
        }

        const unitPrice = parseFloat(menuItem.price);
        const lineSubtotal = Math.round(unitPrice * qty * 100) / 100;
        computedSubtotal += lineSubtotal;

        verifiedItems.push({
          item_id: menuItem.item_id,
          quantity: qty,
          unit_price: unitPrice,
          subtotal: lineSubtotal,
          special_instructions: reqItem.special_instructions || null
        });
      }

      // Compute tax and final
      const taxRateNum = parseFloat(tax_rate) || 0.0;
      const computedTax = Math.round(computedSubtotal * (taxRateNum / 100) * 100) / 100;
      const discountNum = Math.min(parseFloat(discount_amount) || 0.0, computedSubtotal + computedTax);
      const computedFinal = Math.max(0, Math.round((computedSubtotal + computedTax - discountNum) * 100) / 100);

      // Generate order number (e.g. ORD-20261025-1042)
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

      // 3. Insert order
      const insertOrderSql = `
        INSERT INTO orders (
          order_number, table_id, staff_id, customer_id, order_type,
          order_status, subtotal, tax_amount, discount_amount, final_amount, notes
        ) VALUES (?, ?, ?, ?, ?, 'placed', ?, ?, ?, ?, ?)
      `;
      const [orderResult] = await conn.execute(insertOrderSql, [
        orderNumber,
        table_id,
        staff_id,
        customer_id,
        order_type,
        computedSubtotal,
        computedTax,
        discountNum,
        computedFinal,
        notes
      ]);
      const newOrderId = orderResult.insertId;

      // 4. Insert order items
      for (const item of verifiedItems) {
        await conn.execute(
          `INSERT INTO order_items (
            order_id, item_id, quantity, unit_price, subtotal, special_instructions, status
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
          [
            newOrderId,
            item.item_id,
            item.quantity,
            item.unit_price,
            item.subtotal,
            item.special_instructions
          ]
        );
      }

      // 5. Update table status to occupied if dine-in
      if (order_type === 'dine_in' && table_id) {
        await conn.execute(
          "UPDATE restaurant_tables SET status = 'occupied' WHERE table_id = ?",
          [table_id]
        );
      }

      // 6. Record audit entry
      await conn.execute(
        `INSERT INTO order_status_history (order_id, old_status, new_status, notes)
         VALUES (?, NULL, 'placed', 'Order initialized and placed')`,
        [newOrderId]
      );

      return newOrderId;
    });
  },

  /**
   * Update order status with strict lifecycle validation
   */
  async updateStatus(orderId, newStatus) {
    const order = await this.findById(orderId);
    if (!order) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      throw error;
    }

    const currentStatus = order.order_status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      const error = new Error(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed: [${allowed.join(', ')}]`
      );
      error.statusCode = 400;
      throw error;
    }

    await withTransaction(async (conn) => {
      await conn.execute('UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?', [
        newStatus,
        orderId
      ]);

      // If order is cancelled and had a table, release table back to available
      if (newStatus === 'cancelled' && order.table_id) {
        await conn.execute("UPDATE restaurant_tables SET status = 'available' WHERE table_id = ?", [
          order.table_id
        ]);
      }
    });

    return await this.findById(orderId);
  },

  /**
   * Add a new item to an existing active order (placed or preparing)
   */
  async addItem(orderId, { item_id, quantity = 1, special_instructions = null }) {
    const order = await this.findById(orderId);
    if (!order) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!['placed', 'preparing'].includes(order.order_status)) {
      const error = new Error(`Cannot add items to order in '${order.order_status}' status.`);
      error.statusCode = 400;
      throw error;
    }

    const [items] = await query('SELECT item_id, name, price, is_available FROM menu_items WHERE item_id = ?', [
      item_id
    ]);
    if (items.length === 0 || !items[0].is_available) {
      const error = new Error('Menu item not available.');
      error.statusCode = 400;
      throw error;
    }

    const qty = Math.max(1, parseInt(quantity, 10));
    const unitPrice = parseFloat(items[0].price);
    const subtotal = Math.round(unitPrice * qty * 100) / 100;

    await withTransaction(async (conn) => {
      await conn.execute(
        `INSERT INTO order_items (order_id, item_id, quantity, unit_price, subtotal, special_instructions, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [orderId, item_id, qty, unitPrice, subtotal, special_instructions]
      );

      // Recalculate totals
      await conn.execute(
        `UPDATE orders o
         SET subtotal = (SELECT COALESCE(SUM(subtotal), 0.00) FROM order_items WHERE order_id = ? AND status != 'cancelled'),
             tax_amount = ROUND((SELECT COALESCE(SUM(subtotal), 0.00) FROM order_items WHERE order_id = ? AND status != 'cancelled') * 0.05, 2),
             final_amount = ROUND((SELECT COALESCE(SUM(subtotal), 0.00) FROM order_items WHERE order_id = ? AND status != 'cancelled') * 1.05 - discount_amount, 2),
             updated_at = NOW()
         WHERE o.order_id = ?`,
        [orderId, orderId, orderId, orderId]
      );
    });

    return await this.findById(orderId);
  },

  /**
   * Remove item from an order (placed or preparing)
   */
  async removeItem(orderId, orderItemId) {
    const order = await this.findById(orderId);
    if (!order) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!['placed', 'preparing'].includes(order.order_status)) {
      const error = new Error(`Cannot remove items from order in '${order.order_status}' status.`);
      error.statusCode = 400;
      throw error;
    }

    await withTransaction(async (conn) => {
      await conn.execute('DELETE FROM order_items WHERE order_item_id = ? AND order_id = ?', [
        orderItemId,
        orderId
      ]);

      // Recalculate totals
      await conn.execute(
        `UPDATE orders o
         SET subtotal = (SELECT COALESCE(SUM(subtotal), 0.00) FROM order_items WHERE order_id = ? AND status != 'cancelled'),
             tax_amount = ROUND((SELECT COALESCE(SUM(subtotal), 0.00) FROM order_items WHERE order_id = ? AND status != 'cancelled') * 0.05, 2),
             final_amount = ROUND((SELECT COALESCE(SUM(subtotal), 0.00) FROM order_items WHERE order_id = ? AND status != 'cancelled') * 1.05 - discount_amount, 2),
             updated_at = NOW()
         WHERE o.order_id = ?`,
        [orderId, orderId, orderId, orderId]
      );
    });

    return await this.findById(orderId);
  }
};

module.exports = ordersRepository;
