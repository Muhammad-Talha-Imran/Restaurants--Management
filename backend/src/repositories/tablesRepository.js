const { query } = require('../config/database');

/**
 * Table Repository - Handles all SQL queries for restaurant tables
 */
const tablesRepository = {
  /**
   * Get all tables with optional status, capacity, and active filters
   */
  async findAll({ status, minCapacity, is_active } = {}) {
    let sql = `
      SELECT 
        t.table_id,
        t.table_number,
        t.capacity,
        t.status,
        t.location_notes,
        t.is_active,
        t.created_at,
        o.order_id AS active_order_id,
        o.order_number AS active_order_number,
        o.order_status AS active_order_status
      FROM restaurant_tables t
      LEFT JOIN orders o ON t.table_id = o.table_id AND o.order_status IN ('placed', 'preparing', 'served')
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (minCapacity) {
      sql += ' AND t.capacity >= ?';
      params.push(parseInt(minCapacity, 10));
    }
    if (is_active !== undefined) {
      sql += ' AND t.is_active = ?';
      params.push(is_active === 'true' || is_active === true ? 1 : 0);
    }

    sql += ' ORDER BY t.table_number ASC';

    return await query(sql, params);
  },

  /**
   * Find table by ID
   */
  async findById(tableId) {
    const sql = `
      SELECT 
        t.table_id,
        t.table_number,
        t.capacity,
        t.status,
        t.location_notes,
        t.is_active,
        t.created_at,
        o.order_id AS active_order_id,
        o.order_number AS active_order_number,
        o.order_status AS active_order_status
      FROM restaurant_tables t
      LEFT JOIN orders o ON t.table_id = o.table_id AND o.order_status IN ('placed', 'preparing', 'served')
      WHERE t.table_id = ?
    `;
    const rows = await query(sql, [tableId]);
    return rows[0] || null;
  },

  /**
   * Create new restaurant table
   */
  async create({ table_number, capacity, status = 'available', location_notes = null }) {
    const sql = `
      INSERT INTO restaurant_tables (table_number, capacity, status, location_notes, is_active)
      VALUES (?, ?, ?, ?, TRUE)
    `;
    const result = await query(sql, [table_number, capacity, status, location_notes]);
    return {
      table_id: result.insertId,
      table_number,
      capacity,
      status,
      location_notes,
      is_active: true
    };
  },

  /**
   * Update table details
   */
  async update(tableId, { table_number, capacity, status, location_notes, is_active }) {
    const fields = [];
    const params = [];

    if (table_number !== undefined) {
      fields.push('table_number = ?');
      params.push(table_number);
    }
    if (capacity !== undefined) {
      fields.push('capacity = ?');
      params.push(capacity);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }
    if (location_notes !== undefined) {
      fields.push('location_notes = ?');
      params.push(location_notes);
    }
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) return null;

    params.push(tableId);
    const sql = `UPDATE restaurant_tables SET ${fields.join(', ')} WHERE table_id = ?`;
    await query(sql, params);
    return await this.findById(tableId);
  },

  /**
   * Safely delete or deactivate table
   * If table has orders or reservations, mark inactive instead of hard deleting
   */
  async deleteOrDeactivate(tableId) {
    // Check for existing orders or reservations
    const checkSql = `
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE table_id = ?) AS order_count,
        (SELECT COUNT(*) FROM reservations WHERE table_id = ?) AS res_count
    `;
    const counts = await query(checkSql, [tableId, tableId]);
    const { order_count, res_count } = counts[0];

    if (order_count > 0 || res_count > 0) {
      // Historical references exist: soft-deactivate to preserve database integrity
      await query('UPDATE restaurant_tables SET is_active = FALSE WHERE table_id = ?', [tableId]);
      return {
        action: 'deactivated',
        message: 'Table has historical orders or reservations. Deactivated rather than deleted to preserve referential integrity.'
      };
    } else {
      // Safe to hard delete
      await query('DELETE FROM restaurant_tables WHERE table_id = ?', [tableId]);
      return {
        action: 'deleted',
        message: 'Table successfully removed from database.'
      };
    }
  },

  /**
   * Update table status directly (available, occupied, reserved)
   */
  async updateStatus(tableId, status) {
    const sql = 'UPDATE restaurant_tables SET status = ? WHERE table_id = ?';
    await query(sql, [status, tableId]);
    return await this.findById(tableId);
  }
};

module.exports = tablesRepository;
