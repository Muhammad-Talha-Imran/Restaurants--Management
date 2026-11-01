-- ============================================================================
-- DATABASE MANAGEMENT SYSTEM (DBMS) FINAL PROJECT
-- File: annotated_queries.sql
-- Annotated Relational SQL Query Collection for Demonstration & Viva Defense
-- ============================================================================

USE `restaurant_db`;

-- ============================================================================
-- SECTION A: CRUD OPERATIONS
-- ============================================================================

-- 1. Create (INSERT): Add a new menu item
INSERT INTO `menu_items` (`category_id`, `name`, `description`, `price`, `is_available`)
VALUES (1, 'Mutton Handi Special', 'Boneless mutton cooked with desi butter and cream', 1450.00, TRUE);

-- 2. Read (SELECT): Query active menu items under a specific category with price ordering
SELECT item_id, name, price, is_available
FROM `menu_items`
WHERE category_id = 1 AND is_available = TRUE
ORDER BY price ASC;

-- 3. Update (UPDATE): Update item price and availability
UPDATE `menu_items`
SET price = 1500.00, is_available = TRUE, updated_at = NOW()
WHERE item_id = 1;

-- 4. Delete / Soft-Deactivate (DELETE or Safe Deactivation):
-- Safe deactivation to preserve foreign key historical references in order_items
UPDATE `menu_items`
SET is_available = FALSE
WHERE item_id = 1;


-- ============================================================================
-- SECTION B: MULTI-TABLE JOINS
-- ============================================================================

-- Query 5: 5-Table INNER JOIN generating a comprehensive itemized bill for an order
-- Demonstrates: Orders, Order Items, Menu Items, Tables, Staff
SELECT 
    o.order_number,
    o.created_at AS order_time,
    t.table_number,
    s.full_name AS server_name,
    m.name AS item_name,
    oi.quantity,
    oi.unit_price,
    oi.subtotal AS line_total,
    o.subtotal AS order_subtotal,
    o.tax_amount,
    o.discount_amount,
    o.final_amount
FROM `orders` o
INNER JOIN `restaurant_tables` t ON o.table_id = t.table_id
INNER JOIN `staff` s ON o.staff_id = s.staff_id
INNER JOIN `order_items` oi ON o.order_id = oi.order_id
INNER JOIN `menu_items` m ON oi.item_id = m.item_id
WHERE o.order_id = 1;

-- Query 6: LEFT JOIN for Table Floor Status with Reservations
-- Shows all tables whether or not they currently have an upcoming reservation today
SELECT 
    t.table_id,
    t.table_number,
    t.capacity,
    t.status AS current_status,
    r.reservation_id,
    r.reservation_time,
    r.party_size,
    c.full_name AS reserved_by_customer,
    c.phone AS customer_phone
FROM `restaurant_tables` t
LEFT JOIN `reservations` r ON t.table_id = r.table_id 
    AND DATE(r.reservation_time) = CURDATE() 
    AND r.status = 'confirmed'
LEFT JOIN `customers` c ON r.customer_id = c.customer_id
WHERE t.is_active = TRUE
ORDER BY t.table_number;


-- ============================================================================
-- SECTION C: AGGREGATE FUNCTIONS & GROUP BY with HAVING
-- ============================================================================

-- Query 7: Daily Revenue, Total Orders, and Average Ticket Size
-- Uses: COUNT(), SUM(), AVG(), GROUP BY, and mathematical aggregation
SELECT 
    DATE(o.created_at) AS order_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(o.final_amount) AS gross_sales,
    AVG(o.final_amount) AS average_order_value,
    MIN(o.final_amount) AS smallest_order,
    MAX(o.final_amount) AS largest_order
FROM `orders` o
WHERE o.order_status = 'billed'
GROUP BY DATE(o.created_at)
HAVING SUM(o.final_amount) > 0
ORDER BY order_date DESC;

-- Query 8: Category Sales Breakdown with HAVING
-- Groups sales by menu category and filters categories with high demand
SELECT 
    c.name AS category_name,
    COUNT(DISTINCT oi.order_id) AS orders_count,
    SUM(oi.quantity) AS total_items_sold,
    SUM(oi.subtotal) AS category_revenue
FROM `categories` c
INNER JOIN `menu_items` m ON c.category_id = m.category_id
INNER JOIN `order_items` oi ON m.item_id = oi.item_id
INNER JOIN `orders` o ON oi.order_id = o.order_id AND o.order_status = 'billed'
GROUP BY c.category_id, c.name
HAVING SUM(oi.quantity) >= 5
ORDER BY category_revenue DESC;

-- Query 9: Staff Performance & Sales Volume
SELECT 
    s.staff_id,
    s.full_name,
    s.role,
    COUNT(o.order_id) AS total_orders_handled,
    COALESCE(SUM(o.final_amount), 0.00) AS total_revenue_generated
FROM `staff` s
LEFT JOIN `orders` o ON s.staff_id = o.staff_id AND o.order_status = 'billed'
GROUP BY s.staff_id, s.full_name, s.role
ORDER BY total_revenue_generated DESC;


-- ============================================================================
-- SECTION D: ADVANCED SQL — SUBQUERIES, EXISTS, CASE & DATE FUNCTIONS
-- ============================================================================

-- Query 10: Orders exceeding the overall average order value (Scalar Subquery)
SELECT 
    o.order_id,
    o.order_number,
    o.final_amount,
    o.created_at
FROM `orders` o
WHERE o.final_amount > (
    SELECT AVG(final_amount) 
    FROM `orders` 
    WHERE order_status = 'billed'
)
ORDER BY o.final_amount DESC;

-- Query 11: Menu items that have NEVER been ordered (NOT EXISTS subquery)
SELECT 
    m.item_id,
    m.name,
    c.name AS category_name,
    m.price
FROM `menu_items` m
INNER JOIN `categories` c ON m.category_id = c.category_id
WHERE NOT EXISTS (
    SELECT 1 
    FROM `order_items` oi 
    WHERE oi.item_id = m.item_id
);

-- Query 12: Conditional Revenue by Payment Method (CASE Expression with Aggregation)
SELECT 
    DATE(p.payment_time) AS payment_date,
    SUM(CASE WHEN p.payment_method = 'cash' THEN p.amount_paid ELSE 0 END) AS cash_revenue,
    SUM(CASE WHEN p.payment_method = 'card' THEN p.amount_paid ELSE 0 END) AS card_revenue,
    SUM(CASE WHEN p.payment_method = 'online' THEN p.amount_paid ELSE 0 END) AS online_revenue,
    SUM(p.amount_paid) AS total_daily_revenue
FROM `payments` p
WHERE p.payment_status = 'paid'
GROUP BY DATE(p.payment_time);


-- ============================================================================
-- SECTION E: ATOMIC TRANSACTIONS (COMMIT & ROLLBACK)
-- ============================================================================

-- Demonstration 13: Atomic Order Creation Transaction
-- Creates an order and inserts 2 order items in a single transaction;
-- If any insert fails, the whole transaction rolls back to prevent orphan order records.
START TRANSACTION;

INSERT INTO `orders` (
    `order_number`, `table_id`, `staff_id`, `customer_id`, `order_type`, `order_status`, `subtotal`, `tax_amount`, `final_amount`
) VALUES (
    'ORD-TEST-001', 1, 1, NULL, 'dine_in', 'placed', 25.45, 1.27, 26.72
);

SET @new_order_id = LAST_INSERT_ID();

INSERT INTO `order_items` (`order_id`, `item_id`, `quantity`, `unit_price`, `subtotal`, `special_instructions`)
VALUES 
(@new_order_id, 1, 2, 8.50, 17.00, 'Extra crispy'),
(@new_order_id, 9, 1, 4.50, 4.50, 'Less ice');

-- Automatically updates table status to occupied
UPDATE `restaurant_tables` 
SET `status` = 'occupied' 
WHERE `table_id` = 1;

COMMIT;


-- ============================================================================
-- SECTION F: EXPLAIN QUERY EXECUTION PLANS (Indexing Demonstration)
-- ============================================================================

-- EXPLAIN Analysis: Demonstrates how idx_orders_table_status and idx_orders_created optimize query execution
EXPLAIN SELECT o.order_id, o.order_number, o.order_status, t.table_number
FROM `orders` o
JOIN `restaurant_tables` t ON o.table_id = t.table_id
WHERE o.table_id = 1 AND o.order_status = 'placed';

EXPLAIN SELECT * FROM `reservations`
WHERE `table_id` = 1 AND `reservation_time` >= NOW() AND `status` = 'confirmed';
