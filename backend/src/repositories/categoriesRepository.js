const { query } = require('../config/database');

const categoriesRepository = {
  /**
   * Get all categories with item count
   */
  async findAll({ is_active } = {}) {
    let sql = `
      SELECT 
        c.category_id,
        c.name,
        c.description,
        c.is_active,
        c.created_at,
        COUNT(m.item_id) AS total_items
      FROM categories c
      LEFT JOIN menu_items m ON c.category_id = m.category_id
      WHERE 1=1
    `;
    const params = [];

    if (is_active !== undefined) {
      sql += ' AND c.is_active = ?';
      params.push(is_active === 'true' || is_active === true ? 1 : 0);
    }

    sql += ' GROUP BY c.category_id, c.name, c.description, c.is_active, c.created_at ORDER BY c.name ASC';
    return await query(sql, params);
  },

  /**
   * Find category by ID
   */
  async findById(categoryId) {
    const sql = `
      SELECT 
        c.category_id,
        c.name,
        c.description,
        c.is_active,
        c.created_at,
        COUNT(m.item_id) AS total_items
      FROM categories c
      LEFT JOIN menu_items m ON c.category_id = m.category_id
      WHERE c.category_id = ?
      GROUP BY c.category_id, c.name, c.description, c.is_active, c.created_at
    `;
    const rows = await query(sql, [categoryId]);
    return rows[0] || null;
  },

  /**
   * Create category
   */
  async create({ name, description = null }) {
    const sql = `
      INSERT INTO categories (name, description, is_active)
      VALUES (?, ?, TRUE)
    `;
    const result = await query(sql, [name.trim(), description ? description.trim() : null]);
    return {
      category_id: result.insertId,
      name: name.trim(),
      description,
      is_active: true
    };
  },

  /**
   * Update category
   */
  async update(categoryId, { name, description, is_active }) {
    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name.trim());
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description ? description.trim() : null);
    }
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) return null;

    params.push(categoryId);
    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE category_id = ?`;
    await query(sql, params);
    return await this.findById(categoryId);
  },

  /**
   * Safely delete category or guard against constraint violations
   */
  async delete(categoryId) {
    // Check if menu items exist under this category
    const checkSql = 'SELECT COUNT(*) AS item_count FROM menu_items WHERE category_id = ?';
    const rows = await query(checkSql, [categoryId]);
    const itemCount = rows[0].item_count;

    if (itemCount > 0) {
      const error = new Error(`Cannot delete category because it contains ${itemCount} menu item(s). Please reassign or delete the menu items first.`);
      error.statusCode = 400;
      throw error;
    }

    await query('DELETE FROM categories WHERE category_id = ?', [categoryId]);
    return { success: true, message: 'Category deleted successfully.' };
  }
};

module.exports = categoriesRepository;
