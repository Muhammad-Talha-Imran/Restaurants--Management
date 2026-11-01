const { query } = require('../config/database');

const reservationsRepository = {
  /**
   * Find reservations with date, status, table, customer filters and pagination
   */
  async findAll({ date, status, table_id, customer_id, page = 1, limit = 50 } = {}) {
    let baseSql = `
      FROM reservations r
      INNER JOIN customers c ON r.customer_id = c.customer_id
      INNER JOIN restaurant_tables t ON r.table_id = t.table_id
      LEFT JOIN staff s ON r.created_by_staff_id = s.staff_id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      baseSql += ' AND DATE(r.reservation_time) = ?';
      params.push(date);
    }

    if (status) {
      baseSql += ' AND r.status = ?';
      params.push(status);
    }

    if (table_id) {
      baseSql += ' AND r.table_id = ?';
      params.push(parseInt(table_id, 10));
    }

    if (customer_id) {
      baseSql += ' AND r.customer_id = ?';
      params.push(parseInt(customer_id, 10));
    }

    const countSql = `SELECT COUNT(*) AS total ${baseSql}`;
    const countRows = await query(countSql, params);
    const total = countRows[0].total;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, parseInt(limit, 10) || 50);
    const offset = (p - 1) * l;

    const dataSql = `
      SELECT 
        r.reservation_id,
        r.customer_id,
        c.full_name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        r.table_id,
        t.table_number,
        t.capacity AS table_capacity,
        t.location_notes,
        r.reservation_time,
        r.party_size,
        r.status,
        r.special_requests,
        r.created_by_staff_id,
        s.full_name AS staff_name,
        r.created_at,
        r.updated_at
      ${baseSql}
      ORDER BY r.reservation_time ASC
      LIMIT ${l} OFFSET ${offset}
    `;

    const reservations = await query(dataSql, params);

    return {
      reservations,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    };
  },

  /**
   * Find reservation by ID
   */
  async findById(reservationId) {
    const sql = `
      SELECT 
        r.reservation_id,
        r.customer_id,
        c.full_name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        r.table_id,
        t.table_number,
        t.capacity AS table_capacity,
        t.location_notes,
        r.reservation_time,
        r.party_size,
        r.status,
        r.special_requests,
        r.created_by_staff_id,
        s.full_name AS staff_name,
        r.created_at,
        r.updated_at
      FROM reservations r
      INNER JOIN customers c ON r.customer_id = c.customer_id
      INNER JOIN restaurant_tables t ON r.table_id = t.table_id
      LEFT JOIN staff s ON r.created_by_staff_id = s.staff_id
      WHERE r.reservation_id = ?
    `;
    const rows = await query(sql, [reservationId]);
    return rows[0] || null;
  },

  /**
   * Check for conflicting reservation on the same table within 2 hours
   */
  async checkConflict(tableId, reservationTime, excludeReservationId = null) {
    let sql = `
      SELECT 
        r.reservation_id,
        r.reservation_time,
        c.full_name AS customer_name
      FROM reservations r
      INNER JOIN customers c ON r.customer_id = c.customer_id
      WHERE r.table_id = ?
        AND r.status = 'confirmed'
        AND ABS(TIMESTAMPDIFF(MINUTE, r.reservation_time, ?)) < 120
    `;
    const params = [tableId, reservationTime];

    if (excludeReservationId) {
      sql += ' AND r.reservation_id != ?';
      params.push(excludeReservationId);
    }

    const rows = await query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Create new reservation
   */
  async create({
    customer_id,
    table_id,
    reservation_time,
    party_size,
    special_requests = null,
    created_by_staff_id = null
  }) {
    // 1. Verify table capacity
    const tableRows = await query('SELECT capacity, is_active FROM restaurant_tables WHERE table_id = ?', [table_id]);
    if (tableRows.length === 0 || !tableRows[0].is_active) {
      const error = new Error('Specified table does not exist or is inactive.');
      error.statusCode = 400;
      throw error;
    }

    if (party_size > tableRows[0].capacity) {
      const error = new Error(`Party size (${party_size}) exceeds table capacity (${tableRows[0].capacity}).`);
      error.statusCode = 400;
      throw error;
    }

    // 2. Check conflict window (2 hours)
    const conflict = await this.checkConflict(table_id, reservation_time);
    if (conflict) {
      const error = new Error(
        `Time slot conflict: Table already reserved at ${conflict.reservation_time} for customer '${conflict.customer_name}'. Please select another time or table.`
      );
      error.statusCode = 409;
      throw error;
    }

    const sql = `
      INSERT INTO reservations (
        customer_id, table_id, reservation_time, party_size, status, special_requests, created_by_staff_id
      ) VALUES (?, ?, ?, ?, 'confirmed', ?, ?)
    `;
    const result = await query(sql, [
      customer_id,
      table_id,
      reservation_time,
      party_size,
      special_requests,
      created_by_staff_id
    ]);

    return await this.findById(result.insertId);
  },

  /**
   * Update reservation details
   */
  async update(reservationId, updates) {
    const existing = await this.findById(reservationId);
    if (!existing) return null;

    const targetTableId = updates.table_id || existing.table_id;
    const targetTime = updates.reservation_time || existing.reservation_time;
    const targetPartySize = updates.party_size || existing.party_size;

    // Check table capacity if table or party size changed
    if (updates.table_id || updates.party_size) {
      const tableRows = await query('SELECT capacity FROM restaurant_tables WHERE table_id = ?', [targetTableId]);
      if (tableRows.length > 0 && targetPartySize > tableRows[0].capacity) {
        const error = new Error(`Party size (${targetPartySize}) exceeds table capacity (${tableRows[0].capacity}).`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Check conflict if table or time changed and status is confirmed
    if (updates.table_id || updates.reservation_time) {
      const conflict = await this.checkConflict(targetTableId, targetTime, reservationId);
      if (conflict) {
        const error = new Error(`Conflict with existing reservation #${conflict.reservation_id} on table.`);
        error.statusCode = 409;
        throw error;
      }
    }

    const fields = [];
    const params = [];

    if (updates.customer_id !== undefined) {
      fields.push('customer_id = ?');
      params.push(updates.customer_id);
    }
    if (updates.table_id !== undefined) {
      fields.push('table_id = ?');
      params.push(updates.table_id);
    }
    if (updates.reservation_time !== undefined) {
      fields.push('reservation_time = ?');
      params.push(updates.reservation_time);
    }
    if (updates.party_size !== undefined) {
      fields.push('party_size = ?');
      params.push(updates.party_size);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      params.push(updates.status);
    }
    if (updates.special_requests !== undefined) {
      fields.push('special_requests = ?');
      params.push(updates.special_requests);
    }

    if (fields.length === 0) return existing;

    params.push(reservationId);
    const sql = `UPDATE reservations SET ${fields.join(', ')} WHERE reservation_id = ?`;
    await query(sql, params);
    return await this.findById(reservationId);
  },

  /**
   * Update reservation status
   */
  async updateStatus(reservationId, status) {
    const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    await query('UPDATE reservations SET status = ? WHERE reservation_id = ?', [status, reservationId]);
    return await this.findById(reservationId);
  }
};

module.exports = reservationsRepository;
