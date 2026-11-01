const { query } = require('../config/database');

const menuRepository = {
  /**
   * Find menu items with category filtering, text search, price bounds, sorting, and pagination
   */
  async findAll({
    category_id,
    is_available,
    search,
    minPrice,
    maxPrice,
    sortBy = 'name',
    sortOrder = 'ASC',
    page = 1,
    limit = 50
  } = {}) {
    let baseSql = `
      FROM menu_items m
      INNER JOIN categories c ON m.category_id = c.category_id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      baseSql += ' AND m.category_id = ?';
      params.push(parseInt(category_id, 10));
    }

    if (is_available !== undefined && is_available !== '') {
      baseSql += ' AND m.is_available = ?';
      params.push(is_available === 'true' || is_available === true || is_available === 1 ? 1 : 0);
    }

    if (search && search.trim() !== '') {
      baseSql += ' AND (m.name LIKE ? OR m.description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (minPrice !== undefined && minPrice !== '') {
      baseSql += ' AND m.price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      baseSql += ' AND m.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    // Get total count for pagination metadata
    const countSql = `SELECT COUNT(*) AS total ${baseSql}`;
    const countRows = await query(countSql, params);
    const total = countRows[0].total;

    // Validate sorting column to prevent SQL injection
    const allowedSortColumns = {
      name: 'm.name',
      price: 'm.price',
      category: 'c.name',
      created_at: 'm.created_at'
    };
    const sortCol = allowedSortColumns[sortBy] || 'm.name';
    const sortDir = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Pagination bounds
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, parseInt(limit, 10) || 50);
    const offset = (p - 1) * l;

    const dataSql = `
      SELECT 
        m.item_id,
        m.category_id,
        c.name AS category_name,
        m.name,
        m.description,
        m.price,
        m.is_available,
        m.image_url,
        m.created_at,
        m.updated_at
      ${baseSql}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ${l} OFFSET ${offset}
    `;

    const items = await query(dataSql, params);

    return {
      items,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    };
  },

  /**
   * Find item by ID
   */
  async findById(itemId) {
    const sql = `
      SELECT 
        m.item_id,
        m.category_id,
        c.name AS category_name,
        m.name,
        m.description,
        m.price,
        m.is_available,
        m.image_url,
        m.created_at,
        m.updated_at
      FROM menu_items m
      INNER JOIN categories c ON m.category_id = c.category_id
      WHERE m.item_id = ?
    `;
    const rows = await query(sql, [itemId]);
    return rows[0] || null;
  },

  /**
   * Create menu item
   */
  async create({ category_id, name, description, price, is_available = true, image_url = null }) {
    const sql = `
      INSERT INTO menu_items (category_id, name, description, price, is_available, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      category_id,
      name.trim(),
      description ? description.trim() : null,
      price,
      is_available ? 1 : 0,
      image_url
    ]);
    return await this.findById(result.insertId);
  },

  /**
   * Update menu item
   */
  async update(itemId, updates) {
    const fields = [];
    const params = [];

    if (updates.category_id !== undefined) {
      fields.push('category_id = ?');
      params.push(updates.category_id);
    }
    if (updates.name !== undefined) {
      fields.push('name = ?');
      params.push(updates.name.trim());
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description ? updates.description.trim() : null);
    }
    if (updates.price !== undefined) {
      fields.push('price = ?');
      params.push(updates.price);
    }
    if (updates.is_available !== undefined) {
      fields.push('is_available = ?');
      params.push(updates.is_available ? 1 : 0);
    }
    if (updates.image_url !== undefined) {
      fields.push('image_url = ?');
      params.push(updates.image_url);
    }

    if (fields.length === 0) return null;

    params.push(itemId);
    const sql = `UPDATE menu_items SET ${fields.join(', ')} WHERE item_id = ?`;
    await query(sql, params);
    return await this.findById(itemId);
  },

  /**
   * Safely delete menu item
   * If item has been referenced in order_items, soft-deactivate by setting is_available = FALSE
   * to protect referential integrity and historical financial bills.
   */
  async deleteOrDeactivate(itemId) {
    const countSql = 'SELECT COUNT(*) AS order_count FROM order_items WHERE item_id = ?';
    const rows = await query(countSql, [itemId]);
    const orderCount = rows[0].order_count;

    if (orderCount > 0) {
      await query('UPDATE menu_items SET is_available = FALSE WHERE item_id = ?', [itemId]);
      return {
        action: 'deactivated',
        message: `Item has ${orderCount} historical order line(s). Deactivated availability rather than deleted to protect billing history.`
      };
    } else {
      await query('DELETE FROM menu_items WHERE item_id = ?', [itemId]);
      return {
        action: 'deleted',
        message: 'Menu item deleted from database.'
      };
    }
  },

  /**
   * Quick toggle of item availability
   */
  async toggleAvailability(itemId) {
    const item = await this.findById(itemId);
    if (!item) return null;
    const newStatus = !item.is_available;
    await query('UPDATE menu_items SET is_available = ? WHERE item_id = ?', [newStatus ? 1 : 0, itemId]);
    return await this.findById(itemId);
  }
};

module.exports = menuRepository;
