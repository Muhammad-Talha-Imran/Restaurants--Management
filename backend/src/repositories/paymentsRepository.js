const { query, withTransaction } = require('../config/database');

const paymentsRepository = {
  /**
   * Find payments with filters and pagination
   */
  async findAll({ method, status, startDate, endDate, page = 1, limit = 50 } = {}) {
    let baseSql = `
      FROM payments p
      INNER JOIN orders o ON p.order_id = o.order_id
      LEFT JOIN restaurant_tables t ON o.table_id = t.table_id
      LEFT JOIN staff s ON p.received_by_staff_id = s.staff_id
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (method) {
      baseSql += ' AND p.payment_method = ?';
      params.push(method);
    }
    if (status) {
      baseSql += ' AND p.payment_status = ?';
      params.push(status);
    }
    if (startDate) {
      baseSql += ' AND DATE(p.payment_time) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      baseSql += ' AND DATE(p.payment_time) <= ?';
      params.push(endDate);
    }

    const countSql = `SELECT COUNT(*) AS total ${baseSql}`;
    const countRows = await query(countSql, params);
    const total = countRows[0].total;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, parseInt(limit, 10) || 50);
    const offset = (p - 1) * l;

    const dataSql = `
      SELECT 
        p.payment_id,
        p.order_id,
        o.order_number,
        o.order_type,
        t.table_number,
        c.full_name AS customer_name,
        p.amount_paid,
        p.payment_method,
        p.payment_status,
        p.transaction_reference,
        p.payment_time,
        p.received_by_staff_id,
        s.full_name AS staff_name,
        p.notes
      ${baseSql}
      ORDER BY p.payment_time DESC
      LIMIT ${l} OFFSET ${offset}
    `;

    const payments = await query(dataSql, params);

    return {
      payments,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    };
  },

  /**
   * Find payment by order ID
   */
  async findByOrderId(orderId) {
    const sql = `
      SELECT 
        p.payment_id,
        p.order_id,
        o.order_number,
        o.order_type,
        t.table_number,
        c.full_name AS customer_name,
        p.amount_paid,
        p.payment_method,
        p.payment_status,
        p.transaction_reference,
        p.payment_time,
        p.received_by_staff_id,
        s.full_name AS staff_name,
        p.notes
      FROM payments p
      INNER JOIN orders o ON p.order_id = o.order_id
      LEFT JOIN restaurant_tables t ON o.table_id = t.table_id
      LEFT JOIN staff s ON p.received_by_staff_id = s.staff_id
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      WHERE p.order_id = ?
    `;
    const rows = await query(sql, [orderId]);
    return rows[0] || null;
  },

  /**
   * Settle payment for an order atomically
   */
  async processPayment({
    order_id,
    amount_paid,
    payment_method = 'cash',
    transaction_reference = null,
    received_by_staff_id = null,
    notes = null
  }) {
    return await withTransaction(async (conn) => {
      // 1. Check order existence and status
      const [orderRows] = await conn.execute(
        'SELECT order_id, table_id, order_status, final_amount FROM orders WHERE order_id = ? FOR UPDATE',
        [order_id]
      );

      if (orderRows.length === 0) {
        const error = new Error('Order not found.');
        error.statusCode = 404;
        throw error;
      }

      const order = orderRows[0];

      // 2. Prevent duplicate payment
      const [existingPayments] = await conn.execute(
        'SELECT payment_id FROM payments WHERE order_id = ?',
        [order_id]
      );

      if (existingPayments.length > 0) {
        const error = new Error(`Order #${order_id} has already been paid (Payment ID: ${existingPayments[0].payment_id}).`);
        error.statusCode = 409;
        throw error;
      }

      const payableAmount = amount_paid !== undefined ? parseFloat(amount_paid) : parseFloat(order.final_amount);
      if (payableAmount < 0) {
        const error = new Error('Payment amount cannot be negative.');
        error.statusCode = 400;
        throw error;
      }

      // 3. Insert payment record
      const [paymentResult] = await conn.execute(
        `INSERT INTO payments (
          order_id, amount_paid, payment_method, payment_status, transaction_reference, payment_time, received_by_staff_id, notes
        ) VALUES (?, ?, ?, 'paid', ?, NOW(), ?, ?)`,
        [order_id, payableAmount, payment_method, transaction_reference, received_by_staff_id, notes]
      );

      // 4. Update order status to 'billed'
      await conn.execute(
        "UPDATE orders SET order_status = 'billed', updated_at = NOW() WHERE order_id = ?",
        [order_id]
      );

      // 5. Release associated table back to 'available' if dine-in
      if (order.table_id) {
        await conn.execute(
          "UPDATE restaurant_tables SET status = 'available' WHERE table_id = ?",
          [order.table_id]
        );
      }

      return {
        payment_id: paymentResult.insertId,
        order_id,
        amount_paid: payableAmount,
        payment_method,
        payment_status: 'paid',
        transaction_reference
      };
    });
  }
};

module.exports = paymentsRepository;
