const { query } = require('../config/database');

const customersRepository = {
  /**
   * Find customers with search and pagination
   */
  async findAll({ search, page = 1, limit = 50 } = {}) {
    let baseSql = 'FROM customers c WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      baseSql += ' AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const countSql = `SELECT COUNT(*) AS total ${baseSql}`;
    const countRows = await query(countSql, params);
    const total = countRows[0].total;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, parseInt(limit, 10) || 50);
    const offset = (p - 1) * l;

    const dataSql = `
      SELECT 
        c.customer_id,
        c.full_name,
        c.phone,
        c.email,
        c.notes,
        c.created_at,
        COUNT(DISTINCT r.reservation_id) AS total_reservations,
        COUNT(DISTINCT o.order_id) AS total_orders
      ${baseSql}
      LEFT JOIN reservations r ON c.customer_id = r.customer_id
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      GROUP BY c.customer_id, c.full_name, c.phone, c.email, c.notes, c.created_at
      ORDER BY c.created_at DESC
      LIMIT ${l} OFFSET ${offset}
    `;

    const customers = await query(dataSql, params);

    return {
      customers,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    };
  },

  /**
   * Find customer by ID
   */
  async findById(customerId) {
    const sql = `
      SELECT 
        c.customer_id,
        c.full_name,
        c.phone,
        c.email,
        c.notes,
        c.created_at,
        COUNT(DISTINCT r.reservation_id) AS total_reservations,
        COUNT(DISTINCT o.order_id) AS total_orders
      FROM customers c
      LEFT JOIN reservations r ON c.customer_id = r.customer_id
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      WHERE c.customer_id = ?
      GROUP BY c.customer_id, c.full_name, c.phone, c.email, c.notes, c.created_at
    `;
    const rows = await query(sql, [customerId]);
    return rows[0] || null;
  },

  /**
   * Find customer by phone number
   */
  async findByPhone(phone) {
    const sql = 'SELECT * FROM customers WHERE phone = ?';
    const rows = await query(sql, [phone.trim()]);
    return rows[0] || null;
  },

  /**
   * Find existing customer by phone or create new record
   */
  async findOrCreate({ full_name, phone, email = null, notes = null }) {
    if (!phone || !full_name) {
      throw new Error('Customer full_name and phone are required.');
    }

    const cleanPhone = phone.trim();
    const existing = await this.findByPhone(cleanPhone);
    if (existing) {
      // Update name/email if provided
      await query(
        'UPDATE customers SET full_name = ?, email = COALESCE(?, email), notes = COALESCE(?, notes) WHERE customer_id = ?',
        [full_name.trim(), email ? email.trim() : null, notes ? notes.trim() : null, existing.customer_id]
      );
      return await this.findById(existing.customer_id);
    }

    const insertSql = `
      INSERT INTO customers (full_name, phone, email, notes)
      VALUES (?, ?, ?, ?)
    `;
    const result = await query(insertSql, [
      full_name.trim(),
      cleanPhone,
      email ? email.trim() : null,
      notes ? notes.trim() : null
    ]);

    return await this.findById(result.insertId);
  },

  /**
   * Update customer
   */
  async update(customerId, { full_name, phone, email, notes }) {
    const fields = [];
    const params = [];

    if (full_name !== undefined) {
      fields.push('full_name = ?');
      params.push(full_name.trim());
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      params.push(phone.trim());
    }
    if (email !== undefined) {
      fields.push('email = ?');
      params.push(email ? email.trim() : null);
    }
    if (notes !== undefined) {
      fields.push('notes = ?');
      params.push(notes ? notes.trim() : null);
    }

    if (fields.length === 0) return null;

    params.push(customerId);
    const sql = `UPDATE customers SET ${fields.join(', ')} WHERE customer_id = ?`;
    await query(sql, params);
    return await this.findById(customerId);
  }
};

module.exports = customersRepository;
