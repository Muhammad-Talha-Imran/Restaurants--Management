-- ============================================================================
-- DATABASE MANAGEMENT SYSTEM (DBMS) FINAL PROJECT
-- File: views.sql
-- Views for Reporting, Aggregation, and Real-Time Dashboard Queries
-- ============================================================================

USE `restaurant_db`;

-- ----------------------------------------------------------------------------
-- 1. View: v_active_orders_summary
-- Demonstrates: Multi-table JOINs, GROUP BY, Aggregate functions, COALESCE
-- Used by: Staff Order Management & Kitchen Display System
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS `v_active_orders_summary`;
CREATE VIEW `v_active_orders_summary` AS
SELECT 
    o.order_id,
    o.order_number,
    o.order_type,
    o.order_status,
    o.created_at,
    o.final_amount,
    t.table_id,
    t.table_number,
    t.location_notes,
    s.staff_id,
    s.full_name AS staff_name,
    s.role AS staff_role,
    c.customer_id,
    c.full_name AS customer_name,
    c.phone AS customer_phone,
    COUNT(oi.order_item_id) AS total_items_count,
    COALESCE(SUM(oi.quantity), 0) AS total_item_quantity
FROM `orders` o
LEFT JOIN `restaurant_tables` t ON o.table_id = t.table_id
LEFT JOIN `staff` s ON o.staff_id = s.staff_id
LEFT JOIN `customers` c ON o.customer_id = c.customer_id
LEFT JOIN `order_items` oi ON o.order_id = oi.order_id
WHERE o.order_status IN ('placed', 'preparing', 'served')
GROUP BY 
    o.order_id, 
    o.order_number, 
    o.order_type, 
    o.order_status, 
    o.created_at, 
    o.final_amount, 
    t.table_id, 
    t.table_number, 
    t.location_notes, 
    s.staff_id, 
    s.full_name, 
    s.role, 
    c.customer_id, 
    c.full_name, 
    c.phone;

-- ----------------------------------------------------------------------------
-- 2. View: v_daily_sales_report
-- Demonstrates: Date truncation, Aggregate math (SUM, AVG, COUNT), Subtotal & Tax tracking
-- Used by: Admin Analytics Dashboard & Accounting
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS `v_daily_sales_report`;
CREATE VIEW `v_daily_sales_report` AS
SELECT 
    DATE(o.created_at) AS sales_date,
    COUNT(DISTINCT o.order_id) AS total_orders_count,
    COUNT(DISTINCT CASE WHEN o.order_status = 'billed' THEN o.order_id END) AS billed_orders_count,
    COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN o.order_id END) AS cancelled_orders_count,
    COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount_paid ELSE 0 END), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN o.tax_amount ELSE 0 END), 0) AS total_tax_collected,
    COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN o.discount_amount ELSE 0 END), 0) AS total_discount_given,
    COALESCE(AVG(CASE WHEN p.payment_status = 'paid' THEN p.amount_paid END), 0) AS average_order_value
FROM `orders` o
LEFT JOIN `payments` p ON o.order_id = p.order_id
GROUP BY DATE(o.created_at);

-- ----------------------------------------------------------------------------
-- 3. View: v_item_sales_ranking
-- Demonstrates: Inner joins across order_items, menu_items, and categories with aggregation
-- Used by: Admin Menu Popularity & Best-Selling Analytics
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS `v_item_sales_ranking`;
CREATE VIEW `v_item_sales_ranking` AS
SELECT 
    m.item_id,
    m.name AS item_name,
    c.name AS category_name,
    m.price AS current_price,
    m.is_available,
    COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
    COALESCE(SUM(oi.subtotal), 0.00) AS total_gross_sales,
    COUNT(DISTINCT oi.order_id) AS times_ordered
FROM `menu_items` m
INNER JOIN `categories` c ON m.category_id = c.category_id
LEFT JOIN `order_items` oi ON m.item_id = oi.item_id
LEFT JOIN `orders` o ON oi.order_id = o.order_id AND o.order_status = 'billed'
GROUP BY 
    m.item_id, 
    m.name, 
    c.name, 
    m.price, 
    m.is_available;

-- ----------------------------------------------------------------------------
-- 4. View: v_table_occupancy_current
-- Demonstrates: Left joins to show live table state and assigned active order
-- Used by: Table Management & Floor Plan Grid
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS `v_table_occupancy_current`;
CREATE VIEW `v_table_occupancy_current` AS
SELECT 
    t.table_id,
    t.table_number,
    t.capacity,
    t.status AS table_status,
    t.location_notes,
    o.order_id AS active_order_id,
    o.order_number AS active_order_number,
    o.order_status AS active_order_status,
    o.final_amount AS current_bill_amount,
    s.full_name AS server_name,
    TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) AS elapsed_minutes
FROM `restaurant_tables` t
LEFT JOIN `orders` o ON t.table_id = o.table_id AND o.order_status IN ('placed', 'preparing', 'served')
LEFT JOIN `staff` s ON o.staff_id = s.staff_id
WHERE t.is_active = TRUE;
