const { query } = require('../config/database');

const staffRepository = {
  /**
   * Find staff members with role, status, and search filters
   */
  async findAll({ role, is_active, search } = {}) {
    let sql = `
      SELECT 
        s.staff_id,
        s.full_name,
        s.role,
        s.phone,
        s.email,
        s.is_active,
        s.created_at,
        sa.account_id,
        sa.username,
        sa.role AS account_role,
        sa.is_active AS account_active,
        sa.last_login,
        COUNT(DISTINCT o.order_id) AS total_orders_handled
      FROM staff s
      LEFT JOIN staff_accounts sa ON s.staff_id = sa.staff_id
      LEFT JOIN orders o ON s.staff_id = o.staff_id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      sql += ' AND s.role = ?';
      params.push(role);
    }

    if (is_active !== undefined) {
      sql += ' AND s.is_active = ?';
      params.push(is_active === 'true' || is_active === true ? 1 : 0);
    }

    if (search && search.trim() !== '') {
      sql += ' AND (s.full_name LIKE ? OR s.phone LIKE ? OR s.email LIKE ? OR sa.username LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    sql += ' GROUP BY s.staff_id, s.full_name, s.role, s.phone, s.email, s.is_active, s.created_at, sa.account_id, sa.username, sa.role, sa.is_active, sa.last_login ORDER BY s.full_name ASC';

    return await query(sql, params);
  },

  /**
   * Find staff by ID
   */
  async findById(staffId) {
    const sql = `
      SELECT 
        s.staff_id,
        s.full_name,
        s.role,
        s.phone,
        s.email,
        s.is_active,
        s.created_at,
        sa.account_id,
        sa.username,
        sa.role AS account_role,
        sa.is_active AS account_active,
        sa.last_login
      FROM staff s
      LEFT JOIN staff_accounts sa ON s.staff_id = sa.staff_id
      WHERE s.staff_id = ?
    `;
    const rows = await query(sql, [staffId]);
    return rows[0] || null;
  },

  /**
   * Find staff account by username (including password_hash for auth)
   */
  async findAccountByUsername(username) {
    const sql = `
      SELECT 
        sa.account_id,
        sa.staff_id,
        sa.username,
        sa.password_hash,
        sa.role,
        sa.is_active AS account_active,
        sa.last_login,
        s.full_name,
        s.email,
        s.role AS staff_role,
        s.is_active AS staff_active
      FROM staff_accounts sa
      INNER JOIN staff s ON sa.staff_id = s.staff_id
      WHERE sa.username = ?
    `;
    const rows = await query(sql, [username.trim()]);
    return rows[0] || null;
  },

  /**
   * Create new staff member
   */
  async createStaff({ full_name, role = 'waiter', phone, email }) {
    const sql = `
      INSERT INTO staff (full_name, role, phone, email, is_active)
      VALUES (?, ?, ?, ?, TRUE)
    `;
    const result = await query(sql, [full_name.trim(), role, phone.trim(), email.trim()]);
    return await this.findById(result.insertId);
  },

  /**
   * Create staff account for authentication
   */
  async createAccount({ staff_id, username, password_hash, role = 'waiter' }) {
    const sql = `
      INSERT INTO staff_accounts (staff_id, username, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, TRUE)
    `;
    const result = await query(sql, [staff_id, username.trim(), password_hash, role]);
    return {
      account_id: result.insertId,
      staff_id,
      username: username.trim(),
      role,
      is_active: true
    };
  },

  /**
   * Update staff member details
   */
  async updateStaff(staffId, updates) {
    const fields = [];
    const params = [];

    if (updates.full_name !== undefined) {
      fields.push('full_name = ?');
      params.push(updates.full_name.trim());
    }
    if (updates.role !== undefined) {
      fields.push('role = ?');
      params.push(updates.role);
    }
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      params.push(updates.phone.trim());
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      params.push(updates.email.trim());
    }
    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(updates.is_active ? 1 : 0);
    }

    if (fields.length === 0) return null;

    params.push(staffId);
    const sql = `UPDATE staff SET ${fields.join(', ')} WHERE staff_id = ?`;
    await query(sql, params);
    return await this.findById(staffId);
  },

  /**
   * Update staff account details or password
   */
  async updateAccount(accountId, { password_hash, role, is_active }) {
    const fields = [];
    const params = [];

    if (password_hash !== undefined) {
      fields.push('password_hash = ?');
      params.push(password_hash);
    }
    if (role !== undefined) {
      fields.push('role = ?');
      params.push(role);
    }
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) return null;

    params.push(accountId);
    const sql = `UPDATE staff_accounts SET ${fields.join(', ')} WHERE account_id = ?`;
    await query(sql, params);
    return true;
  },

  /**
   * Record last login timestamp
   */
  async updateLastLogin(accountId) {
    await query('UPDATE staff_accounts SET last_login = NOW() WHERE account_id = ?', [accountId]);
  },

  /**
   * Soft deactivate staff member and associated account
   */
  async deactivate(staffId) {
    await query('UPDATE staff SET is_active = FALSE WHERE staff_id = ?', [staffId]);
    await query('UPDATE staff_accounts SET is_active = FALSE WHERE staff_id = ?', [staffId]);
    return await this.findById(staffId);
  }
};

module.exports = staffRepository;
