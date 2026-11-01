# Annotated Relational SQL Query Collection

## Project: Restaurant Table & Order Management System
**Course:** Database Management System (DBMS)  
**Database:** MySQL / MariaDB (`restaurant_db`)

---

## Table of Contents
1. [Section A: CRUD Operations](#section-a-crud-operations)
2. [Section B: Complex Multi-Table JOIN Queries](#section-b-complex-multi-table-join-queries)
3. [Section C: Aggregate Functions & GROUP BY with HAVING](#section-c-aggregate-functions--group-by-with-having)
4. [Section D: Advanced Subqueries & Conditional SQL](#section-d-advanced-subqueries--conditional-sql)
5. [Section E: Atomic Transactions & Integrity](#section-e-atomic-transactions--integrity)
6. [Section F: Database Views](#section-f-database-views)
7. [Section G: Database Triggers](#section-g-database-triggers)
8. [Section H: Stored Procedures](#section-h-stored-procedures)
9. [Section I: Query Execution Plans (EXPLAIN Analysis)](#section-i-query-execution-plans-explain-analysis)

---

## Section A: CRUD Operations

### 1. Create (INSERT): Add New Menu Item with Category Constraint
```sql
INSERT INTO `menu_items` (
    `category_id`, `name`, `description`, `price`, `is_available`
) VALUES (
    1, 'Spicy Wagyu Meatballs', 'Slow-cooked wagyu in spicy pomodoro sauce', 12.50, TRUE
);
```
*DBMS Concept:* Enforces foreign key referential integrity referencing `categories(category_id)` and check constraint `CHECK (price >= 0)`.

### 2. Read (SELECT): Paginated Menu Search with Price Bounds & Ordering
```sql
SELECT 
    m.item_id, m.name, c.name AS category_name, m.price, m.is_available
FROM `menu_items` m
INNER JOIN `categories` c ON m.category_id = c.category_id
WHERE m.category_id = 1 
  AND m.price BETWEEN 5.00 AND 20.00
  AND m.name LIKE '%crispy%'
ORDER BY m.price ASC
LIMIT 10 OFFSET 0;
```
*DBMS Concept:* Parameterized pattern matching (`LIKE`), range filtering (`BETWEEN`), and deterministic ordering with `LIMIT/OFFSET` pagination executed on the database server.

### 3. Update (UPDATE): Update Table Status with Concurrency Safety
```sql
UPDATE `restaurant_tables`
SET `status` = 'occupied'
WHERE `table_id` = 1 AND `status` = 'available';
```
*DBMS Concept:* Conditional update prevents race conditions if two waiters simultaneously attempt to seat guests at the same table.

### 4. Delete / Soft Deactivation (UPDATE / DELETE):
```sql
-- Safe deactivation to preserve foreign key references in historical bills
UPDATE `restaurant_tables`
SET `is_active` = FALSE
WHERE `table_id` = 1;
```
*DBMS Concept:* Preserves referential integrity in child tables (`orders`, `reservations`) while hiding decommissioned tables from the floor interface.

---

## Section B: Complex Multi-Table JOIN Queries

### Query 5: 5-Table Itemized Bill Join
Generates a complete, audited customer receipt by joining orders, items, catalog, tables, staff, and payments.
```sql
SELECT 
    o.order_number,
    o.order_type,
    o.created_at AS order_time,
    t.table_number,
    s.full_name AS server_name,
    c.full_name AS customer_name,
    m.name AS item_name,
    oi.quantity,
    oi.unit_price AS historical_unit_price,
    oi.subtotal AS item_line_subtotal,
    o.subtotal AS order_subtotal,
    o.tax_amount,
    o.discount_amount,
    o.final_amount,
    p.payment_method,
    p.transaction_reference,
    p.payment_status
FROM `orders` o
INNER JOIN `restaurant_tables` t ON o.table_id = t.table_id
INNER JOIN `staff` s ON o.staff_id = s.staff_id
LEFT JOIN `customers` c ON o.customer_id = c.customer_id
INNER JOIN `order_items` oi ON o.order_id = oi.order_id
INNER JOIN `menu_items` m ON oi.item_id = m.item_id
LEFT JOIN `payments` p ON o.order_id = p.order_id
WHERE o.order_id = 1;
```

### Query 6: LEFT JOIN for Table Floor Status & Upcoming Bookings
Displays all active floor tables and joins any confirmed reservation scheduled for today.
```sql
SELECT 
    t.table_id,
    t.table_number,
    t.capacity,
    t.status AS current_status,
    r.reservation_id,
    r.reservation_time,
    r.party_size,
    c.full_name AS customer_name,
    c.phone AS customer_phone
FROM `restaurant_tables` t
LEFT JOIN `reservations` r ON t.table_id = r.table_id 
    AND DATE(r.reservation_time) = CURDATE() 
    AND r.status = 'confirmed'
LEFT JOIN `customers` c ON r.customer_id = c.customer_id
WHERE t.is_active = TRUE
ORDER BY t.table_number ASC;
```

---

## Section C: Aggregate Functions & GROUP BY with HAVING

### Query 7: Daily Revenue Summary with Aggregate Math
```sql
SELECT 
    DATE(o.created_at) AS sales_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT CASE WHEN o.order_status = 'billed' THEN o.order_id END) AS billed_orders,
    COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount_paid ELSE 0 END), 0.00) AS total_revenue,
    COALESCE(AVG(CASE WHEN p.payment_status = 'paid' THEN p.amount_paid END), 0.00) AS average_ticket_value,
    MIN(CASE WHEN p.payment_status = 'paid' THEN p.amount_paid END) AS min_order_value,
    MAX(CASE WHEN p.payment_status = 'paid' THEN p.amount_paid END) AS max_order_value
FROM `orders` o
LEFT JOIN `payments` p ON o.order_id = p.order_id
GROUP BY DATE(o.created_at)
HAVING total_revenue > 0
ORDER BY sales_date DESC;
```

### Query 8: Best-Selling Menu Items with HAVING Filter
```sql
SELECT 
    m.item_id,
    m.name AS dish_name,
    c.name AS category,
    SUM(oi.quantity) AS total_units_sold,
    SUM(oi.subtotal) AS gross_revenue
FROM `order_items` oi
INNER JOIN `menu_items` m ON oi.item_id = m.item_id
INNER JOIN `categories` c ON m.category_id = c.category_id
INNER JOIN `orders` o ON oi.order_id = o.order_id AND o.order_status = 'billed'
GROUP BY m.item_id, m.name, c.name
HAVING SUM(oi.quantity) >= 2
ORDER BY gross_revenue DESC;
```

---

## Section D: Advanced Subqueries & Conditional SQL

### Query 9: Scalar Subquery for High-Value Orders
Finds all orders whose bill exceeds the average order value across the restaurant.
```sql
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
```

### Query 10: Correlated NOT EXISTS Subquery
Identifies menu items that have never been ordered by any customer.
```sql
SELECT 
    m.item_id,
    m.name,
    m.price,
    c.name AS category_name
FROM `menu_items` m
INNER JOIN `categories` c ON m.category_id = c.category_id
WHERE NOT EXISTS (
    SELECT 1 
    FROM `order_items` oi 
    WHERE oi.item_id = m.item_id
);
```

### Query 11: 2-Hour Scheduling Conflict Check (ABS & TIMESTAMPDIFF)
Guarantees that no two parties book the same dining table within a 120-minute window.
```sql
SELECT 
    r.reservation_id,
    r.reservation_time,
    c.full_name AS booked_by
FROM `reservations` r
INNER JOIN `customers` c ON r.customer_id = c.customer_id
WHERE r.table_id = 1
  AND r.status = 'confirmed'
  AND ABS(TIMESTAMPDIFF(MINUTE, r.reservation_time, '2026-10-26 19:00:00')) < 120;
```

---

## Section E: Atomic Transactions & Integrity

### Multi-Step Order Placement Transaction (ACID)
Executed in `ordersRepository.createWithItems`:
```sql
START TRANSACTION;

-- 1. Lock dining table to prevent concurrent reservation/assignment
SELECT table_id, status FROM `restaurant_tables` WHERE table_id = 1 FOR UPDATE;

-- 2. Insert master order record
INSERT INTO `orders` (
    `order_number`, `table_id`, `staff_id`, `customer_id`, `order_type`, `order_status`,
    `subtotal`, `tax_amount`, `discount_amount`, `final_amount`
) VALUES (
    'ORD-20261025-1001', 1, 3, 1, 'dine_in', 'placed', 28.35, 1.42, 0.00, 29.77
);

SET @new_order_id = LAST_INSERT_ID();

-- 3. Insert individual order lines with frozen prices
INSERT INTO `order_items` (`order_id`, `item_id`, `quantity`, `unit_price`, `subtotal`, `special_instructions`)
VALUES 
(@new_order_id, 7, 2, 13.50, 27.00, 'Medium well'),
(@new_order_id, 9, 1, 4.50, 4.50, 'Extra ice');

-- 4. Transition table status to occupied
UPDATE `restaurant_tables` SET `status` = 'occupied' WHERE `table_id` = 1;

COMMIT;
-- In case of invalid item availability or capacity violation: ROLLBACK;
```

---

## Section F: Database Views

View `v_daily_sales_report`:
```sql
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
```

---

## Section G: Database Triggers

### Trigger `trg_order_status_audit`
```sql
DELIMITER $$
CREATE TRIGGER `trg_order_status_audit`
AFTER UPDATE ON `orders`
FOR EACH ROW
BEGIN
    IF OLD.order_status <> NEW.order_status THEN
        INSERT INTO `order_status_history` (
            `order_id`, `old_status`, `new_status`, `changed_at`, `notes`
        ) VALUES (
            NEW.order_id, OLD.order_status, NEW.order_status, NOW(),
            CONCAT('Status changed from ', OLD.order_status, ' to ', NEW.order_status)
        );
    END IF;
END$$
DELIMITER ;
```

---

## Section H: Stored Procedures

### Stored Procedure: `sp_settle_order_payment`
```sql
DELIMITER $$
CREATE PROCEDURE `sp_settle_order_payment`(
    IN p_order_id INT,
    IN p_amount DECIMAL(10, 2),
    IN p_method VARCHAR(20),
    IN p_staff_id INT,
    IN p_ref VARCHAR(100),
    OUT p_status VARCHAR(100)
)
BEGIN
    DECLARE v_table_id INT DEFAULT NULL;
    DECLARE v_order_exists INT DEFAULT 0;
    DECLARE v_payment_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'ERROR: Database rollback triggered on exception.';
    END;

    START TRANSACTION;

    SELECT COUNT(*), table_id INTO v_order_exists, v_table_id
    FROM `orders` WHERE `order_id` = p_order_id GROUP BY table_id;

    IF v_order_exists = 0 THEN
        ROLLBACK;
        SET p_status = 'ERROR: Order not found.';
    ELSE
        SELECT COUNT(*) INTO v_payment_exists FROM `payments` WHERE `order_id` = p_order_id;
        IF v_payment_exists > 0 THEN
            ROLLBACK;
            SET p_status = 'ERROR: Order has already been paid.';
        ELSE
            INSERT INTO `payments` (
                `order_id`, `amount_paid`, `payment_method`, `payment_status`, `transaction_reference`, `payment_time`, `received_by_staff_id`
            ) VALUES (p_order_id, p_amount, p_method, 'paid', p_ref, NOW(), p_staff_id);

            UPDATE `orders` SET `order_status` = 'billed', `updated_at` = NOW() WHERE `order_id` = p_order_id;

            IF v_table_id IS NOT NULL THEN
                UPDATE `restaurant_tables` SET `status` = 'available' WHERE `table_id` = v_table_id;
            END IF;

            COMMIT;
            SET p_status = 'SUCCESS: Payment recorded and table released.';
        END IF;
    END IF;
END$$
DELIMITER ;
```

---

## Section I: Query Execution Plans (EXPLAIN Analysis)

### Analyzing Floor Status Filtering
```sql
EXPLAIN SELECT o.order_id, o.order_number, o.order_status, t.table_number
FROM `orders` o
JOIN `restaurant_tables` t ON o.table_id = t.table_id
WHERE o.table_id = 1 AND o.order_status = 'placed';
```

**EXPLAIN Output Interpretation for Viva Defense:**
- **`select_type`**: `SIMPLE`
- **`table`**: `o` (`orders`), `t` (`restaurant_tables`)
- **`type`**: `ref` on `o` and `eq_ref` on `t`
- **`possible_keys`**: `fk_order_table`, `idx_orders_table_status`
- **`key`**: `idx_orders_table_status`
- **`rows`**: 1
- **Academic Discussion:** The composite B-tree index `idx_orders_table_status(table_id, order_status)` allows the query optimizer to perform an index lookup in $O(\log N)$ time rather than performing a full table scan (`type: ALL`).
