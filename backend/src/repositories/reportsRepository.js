const { query } = require('../config/database');

const reportsRepository = {
  /**
   * Real-time dashboard KPI summary query
   * Uses real database aggregation queries, no fake data
   */
  async getDashboardSummary() {
    // 1. Table status counts
    const tableCountsSql = `
      SELECT 
        COUNT(*) AS total_tables,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_tables,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS occupied_tables,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) AS reserved_tables
      FROM restaurant_tables
      WHERE is_active = TRUE
    `;
    const tableCounts = await query(tableCountsSql);

    // 2. Orders & Revenue metrics
    const orderMetricsSql = `
      SELECT 
        COUNT(DISTINCT o.order_id) AS total_orders_all_time,
        COUNT(DISTINCT CASE WHEN DATE(o.created_at) = CURDATE() THEN o.order_id END) AS orders_today,
        COUNT(DISTINCT CASE WHEN o.order_status IN ('placed', 'preparing', 'served') THEN o.order_id END) AS active_orders_count,
        COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount_paid ELSE 0 END), 0.00) AS total_revenue_all_time,
        COALESCE(SUM(CASE WHEN p.payment_status = 'paid' AND DATE(p.payment_time) = CURDATE() THEN p.amount_paid ELSE 0 END), 0.00) AS revenue_today
      FROM orders o
      LEFT JOIN payments p ON o.order_id = p.order_id
    `;
    const orderMetrics = await query(orderMetricsSql);

    // 3. Reservations for today
    const resCountSql = `
      SELECT 
        COUNT(*) AS reservations_today,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS pending_reservations_today
      FROM reservations
      WHERE DATE(reservation_time) = CURDATE()
    `;
    const resCounts = await query(resCountSql);

    // 4. Recent orders
    const recentOrdersSql = `
      SELECT 
        o.order_id,
        o.order_number,
        o.order_type,
        o.order_status,
        o.final_amount,
        o.created_at,
        t.table_number,
        s.full_name AS staff_name
      FROM orders o
      LEFT JOIN restaurant_tables t ON o.table_id = t.table_id
      LEFT JOIN staff s ON o.staff_id = s.staff_id
      ORDER BY o.created_at DESC
      LIMIT 6
    `;
    const recentOrders = await query(recentOrdersSql);

    return {
      tables: tableCounts[0] || {
        total_tables: 0,
        available_tables: 0,
        occupied_tables: 0,
        reserved_tables: 0
      },
      metrics: orderMetrics[0] || {
        total_orders_all_time: 0,
        orders_today: 0,
        active_orders_count: 0,
        total_revenue_all_time: 0.0,
        revenue_today: 0.0
      },
      reservations: resCounts[0] || {
        reservations_today: 0,
        pending_reservations_today: 0
      },
      recent_orders: recentOrders
    };
  },

  /**
   * Daily sales report with date range
   */
  async getDailySalesReport({ startDate, endDate } = {}) {
    let sql = `
      SELECT 
        sales_date,
        total_orders_count,
        billed_orders_count,
        cancelled_orders_count,
        total_revenue,
        total_tax_collected,
        total_discount_given,
        average_order_value
      FROM v_daily_sales_report
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND sales_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND sales_date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY sales_date DESC LIMIT 30';

    return await query(sql, params);
  },

  /**
   * Top selling menu items ranking
   */
  async getTopSellingItems(limit = 10) {
    const l = Math.max(1, parseInt(limit, 10) || 10);
    const sql = `
      SELECT 
        item_id,
        item_name,
        category_name,
        current_price,
        is_available,
        total_units_sold,
        total_gross_sales,
        times_ordered
      FROM v_item_sales_ranking
      WHERE total_units_sold > 0
      ORDER BY total_units_sold DESC, total_gross_sales DESC
      LIMIT ${l}
    `;
    return await query(sql);
  },

  /**
   * Sales breakdown grouped by Category
   */
  async getCategorySales() {
    const sql = `
      SELECT 
        c.category_id,
        c.name AS category_name,
        COUNT(DISTINCT oi.order_id) AS total_orders,
        COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
        COALESCE(SUM(oi.subtotal), 0.00) AS total_sales
      FROM categories c
      INNER JOIN menu_items m ON c.category_id = m.category_id
      LEFT JOIN order_items oi ON m.item_id = oi.item_id
      LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status = 'billed'
      GROUP BY c.category_id, c.name
      ORDER BY total_sales DESC
    `;
    return await query(sql);
  },

  /**
   * Staff activity and order performance report
   */
  async getStaffPerformance() {
    const sql = `
      SELECT 
        s.staff_id,
        s.full_name,
        s.role,
        COUNT(o.order_id) AS total_orders,
        COUNT(CASE WHEN o.order_status = 'billed' THEN 1 END) AS billed_orders,
        COALESCE(SUM(CASE WHEN o.order_status = 'billed' THEN o.final_amount ELSE 0 END), 0.00) AS revenue_handled
      FROM staff s
      LEFT JOIN orders o ON s.staff_id = o.staff_id
      WHERE s.is_active = TRUE
      GROUP BY s.staff_id, s.full_name, s.role
      ORDER BY revenue_handled DESC, total_orders DESC
    `;
    return await query(sql);
  }
};

module.exports = reportsRepository;
