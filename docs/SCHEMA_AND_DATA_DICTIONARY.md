# Database Schema & Data Dictionary

## Project: Restaurant Table & Order Management System
**Database Engine:** MySQL / MariaDB (InnoDB Engine)  
**Character Set:** `utf8mb4` | **Collation:** `utf8mb4_unicode_ci`  
**Database Name:** `restaurant_db`

---

## 1. Table Data Dictionary

### Table 1: `restaurant_tables`
Stores dining tables, seating capacity, and real-time floor availability.

| Column | Data Type | Nullable | Key / Constraint | Default | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `table_id` | INT | NO | **PK**, AUTO_INCREMENT | — | Unique identifier for table |
| `table_number` | VARCHAR(20) | NO | **UK** | — | Visual table number (e.g., T-01, VIP-1) |
| `capacity` | INT | NO | `CHECK (capacity > 0)` | — | Maximum guests that can be seated |
| `status` | ENUM | NO | `'available','occupied','reserved'` | `'available'` | Current occupancy status |
| `location_notes` | VARCHAR(100) | YES | — | NULL | Section note (Window, Patio, Main Hall) |
| `is_active` | BOOLEAN | NO | — | `TRUE` | Soft-deletion flag |
| `created_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP` | Timestamp of table creation |

---

### Table 2: `categories`
Classifies menu items into functional sections (Appetizers, Main Course, Beverages, etc.).

| Column | Data Type | Nullable | Key / Constraint | Default | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `category_id` | INT | NO | **PK**, AUTO_INCREMENT | — | Unique category identifier |
| `name` | VARCHAR(50) | NO | **UK** | — | Unique category name |
| `description` | VARCHAR(255) | YES | — | NULL | Brief description of category |
| `is_active` | BOOLEAN | NO | — | `TRUE` | Active display state |
| `created_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP` | Creation timestamp |

---

### Table 3: `menu_items`
Stores food and beverage offerings, current prices, and real-time kitchen availability.

| Column | Data Type | Nullable | Key / Constraint | Default | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `item_id` | INT | NO | **PK**, AUTO_INCREMENT | — | Unique menu item identifier |
| `category_id` | INT | NO | **FK** &rarr; `categories(category_id)` | — | Parent category reference |
| `name` | VARCHAR(100) | NO | — | — | Name of the dish or beverage |
| `description` | TEXT | YES | — | NULL | Dish description & ingredients |
| `price` | DECIMAL(10,2)| NO | `CHECK (price >= 0)` | — | Current selling price (monetary) |
| `is_available` | BOOLEAN | NO | — | `TRUE` | Controls whether item can be ordered |
| `image_url` | VARCHAR(255) | YES | — | NULL | Optional image reference |
| `created_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP` | Initial record timestamp |
| `updated_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP ON UPDATE` | Last modification timestamp |

---

### Table 4: `customers`
Stores customer contact records used for reservations and personalized order history.

| Column | Data Type | Nullable | Key / Constraint | Default | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `customer_id` | INT | NO | **PK**, AUTO_INCREMENT | — | Unique customer identifier |
| `full_name` | VARCHAR(100) | NO | — | — | Customer full name |
| `phone` | VARCHAR(25) | NO | **UK** | — | Unique telephone contact number |
| `email` | VARCHAR(100) | YES | — | NULL | Email address |
| `notes` | VARCHAR(255) | YES | — | NULL | Dining preferences / dietary notes |
| `created_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP` | Registration date |

---

### Table 5: `staff`
Stores employee records, designated restaurant roles, and contact info.

| Column | Data Type | Nullable | Key / Constraint | Default | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `staff_id` | INT | NO | **PK**, AUTO_INCREMENT | — | Unique staff member identifier |
| `full_name` | VARCHAR(100) | NO | — | — | Employee name |
| `role` | ENUM | NO | `'admin','waiter','cashier','kitchen','manager'` | `'waiter'` | Assigned role in restaurant |
| `phone` | VARCHAR(25) | NO | **UK** | — | Mobile contact |
| `email` | VARCHAR(100) | NO | **UK** | — | Corporate email address |
| `is_active` | BOOLEAN | NO | — | `TRUE` | Employment status flag |
| `created_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP` | Employment commencement date |

---

### Table 6: `staff_accounts`
Stores system user credentials with hashed passwords for authentication and authorization.

| Column | Data Type | Nullable | Key / Constraint | Default | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `account_id` | INT | NO | **PK**, AUTO_INCREMENT | — | Unique account identifier |
| `staff_id` | INT | NO | **FK**, **UK** &rarr; `staff(staff_id)` | — | 1:1 Link to employee record |
| `username` | VARCHAR(50) | NO | **UK** | — | Login identifier |
| `password_hash`| VARCHAR(255)| NO | — | — | Secure bcrypt password hash |
| `role` | ENUM | NO | `'admin','waiter','cashier','kitchen','manager'` | `'waiter'` | Authorization level |
| `is_active` | BOOLEAN | NO | — | `TRUE` | Login enabled/disabled flag |
| `last_login` | DATETIME | YES | — | NULL | Last successful authentication |
| `created_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP` | Account creation date |

---

### Table 7: `reservations`
Links customers to tables for scheduled dates and times with conflict checking.

| Column | Data Type | Nullable | Key / Constraint | Default | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `reservation_id`| INT | NO | **PK**, AUTO_INCREMENT | — | Unique reservation identifier |
| `customer_id` | INT | NO | **FK** &rarr; `customers(customer_id)`| — | Customer who booked |
| `table_id` | INT | NO | **FK** &rarr; `restaurant_tables(table_id)`| — | Assigned table |
| `reservation_time`| DATETIME | NO | — | — | Scheduled date and time |
| `party_size` | INT | NO | `CHECK (party_size > 0)` | — | Number of expected diners |
| `status` | ENUM | NO | `'confirmed','cancelled','completed','no_show'`| `'confirmed'`| Booking status |
| `special_requests`| VARCHAR(255)| YES | — | NULL | Special dining requests |
| `created_by_staff_id`| INT | YES | **FK** &rarr; `staff(staff_id)` | NULL | Staff member who took booking |
| `created_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP` | Booking timestamp |
| `updated_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP ON UPDATE` | Last status update |

---

### Table 8: `orders`
Master order record tracking table reference, lifecycle status, and computed financial totals.

| Column | Data Type | Nullable | Key / Constraint | Default | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `order_id` | INT | NO | **PK**, AUTO_INCREMENT | — | Primary order identifier |
| `order_number` | VARCHAR(30) | NO | **UK** | — | Business order code (e.g. ORD-20261025-1042) |
| `table_id` | INT | YES | **FK** &rarr; `restaurant_tables(table_id)`| NULL | Dining table (NULL for takeaway) |
| `staff_id` | INT | NO | **FK** &rarr; `staff(staff_id)` | — | Responsible waiter / server |
| `customer_id` | INT | YES | **FK** &rarr; `customers(customer_id)` | NULL | Customer (NULL for walk-ins) |
| `order_type` | ENUM | NO | `'dine_in','takeaway'` | `'dine_in'` | Order channel |
| `order_status` | ENUM | NO | `'placed','preparing','served','billed','cancelled'` | `'placed'` | Lifecycle progression stage |
| `subtotal` | DECIMAL(10,2)| NO | `CHECK (subtotal >= 0)` | `0.00` | Sum of item lines |
| `tax_amount` | DECIMAL(10,2)| NO | `CHECK (tax_amount >= 0)` | `0.00` | Applied sales tax (e.g. 5%) |
| `discount_amount`| DECIMAL(10,2)| NO | `CHECK (discount_amount >= 0)`| `0.00` | Promotional deduction |
| `final_amount` | DECIMAL(10,2)| NO | `CHECK (final_amount >= 0)` | `0.00` | Final total payable |
| `notes` | VARCHAR(255) | YES | — | NULL | Special order notes |
| `created_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP` | Order placement time |
| `updated_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP ON UPDATE` | Last status modification |

---

### Table 9: `order_items`
Detail line item records linking specific menu dishes, quantities, and frozen historical unit prices.

| Column | Data Type | Nullable | Key / Constraint | Default | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `order_item_id`| INT | NO | **PK**, AUTO_INCREMENT | — | Unique line item identifier |
| `order_id` | INT | NO | **FK** &rarr; `orders(order_id)` | — | Parent order reference (ON DELETE CASCADE)|
| `item_id` | INT | NO | **FK** &rarr; `menu_items(item_id)` | — | Menu item reference (ON DELETE RESTRICT)|
| `quantity` | INT | NO | `CHECK (quantity > 0)` | — | Ordered quantity |
| `unit_price` | DECIMAL(10,2)| NO | `CHECK (unit_price >= 0)` | — | **Frozen historical price** at order time |
| `subtotal` | DECIMAL(10,2)| NO | `CHECK (subtotal >= 0)` | — | Computed: `quantity * unit_price` |
| `special_instructions`| VARCHAR(255)| YES | — | NULL | Preparation notes (e.g. No onions) |
| `status` | ENUM | NO | `'pending','preparing','served','cancelled'` | `'pending'` | Preparation queue status |
| `created_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP` | Timestamp when added |

---

### Table 10: `payments`
Maintains payment and billing records strictly linked 1-to-1 with orders.

| Column | Data Type | Nullable | Key / Constraint | Default | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `payment_id` | INT | NO | **PK**, AUTO_INCREMENT | — | Unique payment transaction ID |
| `order_id` | INT | NO | **FK**, **UK** &rarr; `orders(order_id)` | — | **Enforces strict 1:1 relationship** |
| `amount_paid` | DECIMAL(10,2)| NO | `CHECK (amount_paid >= 0)` | — | Verified monetary settlement |
| `payment_method`| ENUM | NO | `'cash','card','online','other'` | `'cash'` | Tender type |
| `payment_status`| ENUM | NO | `'paid','refunded','failed'` | `'paid'` | Settlement state |
| `transaction_reference`| VARCHAR(100)| YES | — | NULL | Bank authorization / receipt number |
| `payment_time` | DATETIME | NO | — | `CURRENT_TIMESTAMP` | Payment timestamp |
| `received_by_staff_id`| INT | YES | **FK** &rarr; `staff(staff_id)` | NULL | Staff member who settled bill |
| `notes` | VARCHAR(255) | YES | — | NULL | Cash drawer / accounting notes |

---

### Table 11: `order_status_history`
Audit trail table automatically populated by database trigger `trg_order_status_audit` on every order state transition.

| Column | Data Type | Nullable | Key / Constraint | Default | Purpose / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `history_id` | INT | NO | **PK**, AUTO_INCREMENT | — | Unique audit log ID |
| `order_id` | INT | NO | **FK** &rarr; `orders(order_id)` | — | Order being audited |
| `old_status` | VARCHAR(20) | YES | — | NULL | Previous status |
| `new_status` | VARCHAR(20) | NO | — | — | New status transitioned to |
| `changed_at` | DATETIME | NO | — | `CURRENT_TIMESTAMP` | Exact timestamp of change |
| `notes` | VARCHAR(255) | YES | — | NULL | Audit description |

---

## 2. Database Indexes & Query Optimizations

| Index Name | Table | Columns | Optimization Target |
| :--- | :--- | :--- | :--- |
| `idx_orders_table_status` | `orders` | `(table_id, order_status)` | Speeds up floor status queries checking active table orders |
| `idx_orders_created` | `orders` | `(created_at)` | Accelerates daily sales reporting and date range filters |
| `idx_orders_staff` | `orders` | `(staff_id)` | Accelerates staff performance queries |
| `idx_reservations_datetime_table` | `reservations` | `(table_id, reservation_time, status)` | Powers the 2-hour reservation conflict prevention query |
| `idx_menu_category_avail` | `menu_items` | `(category_id, is_available)` | Optimizes category tab browsing on staff menu interface |
| `idx_payments_order` | `payments` | `(order_id)` | Enforces fast 1:1 lookups from order to payment |
| `idx_payments_time` | `payments` | `(payment_time)` | Optimizes revenue reporting by payment date |

---

## 3. Database Views

1. `v_active_orders_summary`: Pre-joins active orders with tables, servers, customers, and aggregates line counts.
2. `v_daily_sales_report`: Aggregates gross sales, tax, discounts, and average ticket size grouped by date.
3. `v_item_sales_ranking`: Ranks menu items by quantity sold and gross revenue for bestsellers.
4. `v_table_occupancy_current`: Provides real-time table status joined with assigned active order number and elapsed minutes.

---

## 4. Triggers & Stored Procedures

1. **Trigger: `trg_order_status_audit`**: Fires `AFTER UPDATE ON orders` to automatically append an immutable audit record into `order_status_history` whenever `order_status` changes.
2. **Trigger: `trg_sync_table_status_on_order`**: Fires `AFTER INSERT ON orders` to automatically set the dining table's status to `'occupied'` if an active dine-in order is placed.
3. **Stored Procedure: `sp_recalculate_order_totals`**: Aggregates `order_items.subtotal`, calculates 5% tax and promotional discount, and updates `orders` atomically.
4. **Stored Procedure: `sp_settle_order_payment`**: Atomically validates order, inserts payment record, marks order as `billed`, and releases table to `available` with transaction rollback safety.
