# University Final Presentation & Viva Defense Guide

## Project: Restaurant Table & Order Management System
**Course:** Database Management System (DBMS)  
**Academic Level:** University Final Project Defense  
**Group Members:**
1. **Muhammad Huzaifa** (Student ID: `EB25210006062`)
2. **Muhammad Talha Imran** (Student ID: `EB25210006073`)
3. **Muhammad Hammad** (Student ID: `EB25210006056`)
4. **Abuzar** (Student ID: `EB25210006010`)

---

## Member 1 — Muhammad Huzaifa (EB25210006062)
### Role: Project Overview, System Architecture & Full-Stack Demonstration

#### 1. Speaking Script & Topic Breakdown
> "Good morning, respected professors and evaluation committee. My name is Muhammad Huzaifa, and I will be presenting the Project Overview, System Architecture, and Live Application Interface for our final DBMS project: **GourmetOS — Restaurant Table & Order Management System**.
>
> In high-turnover hospitality environments, manual pen-and-paper ordering or disconnected point-of-sale systems suffer from severe data inconsistency: tables are double-booked, active dining table statuses fall out of sync with order tickets, kitchen orders are delayed, and price changes retroactively alter historical financial receipts.
>
> Our objective was to architect a complete, database-driven solution where database integrity, relational modeling, and transactional consistency form the core foundation rather than an afterthought.
>
> **System Architecture:**
> - **Frontend Layer:** React.js powered by Vite, delivering a modern, responsive operations dashboard.
> - **Backend Layer:** Node.js with Express.js structured across repositories, controllers, services, and middlewares.
> - **Database Layer:** Real MySQL / MariaDB relational engine running InnoDB with foreign keys, check constraints, indexes, views, triggers, and stored procedures.
> - **Data Communication:** Secure RESTful JSON APIs using connection pooling (`mysql2/promise`) with 100% parameterized SQL queries to eliminate SQL injection vulnerabilities."

#### 2. Key Code / Schema Touchpoints
- Walkthrough of `/api/health` displaying live connection to `13.0.2-MariaDB` and database `restaurant_db`.
- Demonstration of the role-based interface: Logging in as `admin` displays the Executive Dashboard, Staff Management, and Analytics; logging in as `waiter` restricts access strictly to daily floor operations.

#### 3. Likely Viva Questions & Technical Answers for Huzaifa
- **Q1: Why did your group choose Node.js/Express and MySQL instead of MongoDB or an ORM like Prisma?**  
  *Answer:* "A restaurant system inherently deals with structured relational entities with strict cardinalities: 1 Category has many Items, 1 Table has many Orders, and an Order contains multiple Order Items. Relational integrity (foreign keys, cascading rules, and check constraints) is native to SQL. We deliberately avoided heavy ORMs to write raw, parameterized SQL queries so every JOIN, aggregate, and transaction is transparent, auditable, and academically defensible."
- **Q2: How does the backend prevent SQL injection?**  
  *Answer:* "Every query in our repository layer uses MySQL prepared statements with parameter placeholders (`?`). The database driver compiles the SQL query plan before binding user parameters as literal data, making it impossible for user input to alter the syntax tree."

---

## Member 2 — Muhammad Talha Imran (EB25210006073)
### Role: Relational Database Design, ERD, Constraints & Normalization

#### 1. Speaking Script & Topic Breakdown
> "Respected committee, I am Muhammad Talha Imran. I will be explaining our Relational Database Design, Entity-Relationship Diagram (ERD), Table Schema, and Normalization Analysis.
>
> Our relational database `restaurant_db` consists of **11 base tables**, each designed in accordance with **Third Normal Form (3NF)** and **Boyce-Codd Normal Form (BCNF)**.
>
> **Core Entities & Cardinalities:**
> - `categories` to `menu_items`: 1-to-Many (`ON DELETE RESTRICT` protects child items).
> - `restaurant_tables` to `orders`: 1-to-Many.
> - `restaurant_tables` to `reservations`: 1-to-Many.
> - `customers` to `reservations` & `orders`: 1-to-Many. Notice that `orders.customer_id` is a nullable foreign key (`ON DELETE SET NULL`) to cleanly support walk-in dining without forcing contact registration.
> - `staff` to `staff_accounts`: Strictly 1-to-1 (`UNIQUE(staff_id)` on accounts).
> - `orders` to `payments`: Strictly 1-to-1 enforced by `UNIQUE(order_id)` on the `payments` table.
>
> **Normalization Highlights:**
> - **1NF:** Every column contains atomic values. Repeating item lists are decomposed into `order_items`.
> - **2NF:** Every non-prime attribute is fully functionally dependent on the entire primary key. In `order_items`, attributes depend on `order_item_id`.
> - **3NF:** Transitive dependencies were eliminated: category details exist solely in `categories`, staff roles exist in `staff`, and customer details exist in `customers`.
> - **Justified Denormalization:** We deliberately froze `unit_price` in `order_items`. In strict theoretical 3NF, one might join `menu_items.price`, but if a steak price increases from $25 to $30 next month, past receipts and taxes would be retroactively corrupted. Freezing `unit_price` at the moment of ordering ensures historical financial integrity."

#### 2. Key Code / Schema Touchpoints
- Reference: `database/schema.sql` (Tables 1 through 11).
- Reference: `docs/NORMALIZATION.md` showing step-by-step mathematical decomposition.
- Constraints: `CHECK (capacity > 0)`, `CHECK (price >= 0)`, `CHECK (quantity > 0)`, `CHECK (amount_paid >= 0)`.

#### 3. Likely Viva Questions & Technical Answers for Talha
- **Q1: What is the purpose of the UNIQUE constraint on `payments.order_id`?**  
  *Answer:* "The project proposal mandates that each order has an associated payment record following a 1-to-1 relationship. In relational databases, a 1-to-1 relationship is enforced by placing a `UNIQUE` constraint on the foreign key column (`order_id`) in the child table (`payments`). This guarantees that no order can be paid twice."
- **Q2: Why do you have separate `staff` and `staff_accounts` tables?**  
  *Answer:* "To separate HR/operational employee data (name, phone, role) from security and authentication credentials (hashed passwords, login timestamps). Furthermore, in a real restaurant, some kitchen helpers or bussers may exist as staff members without needing system login access."

---

## Member 3 — Muhammad Hammad (EB25210006056)
### Role: SQL Queries, Aggregations, Joins, Triggers & Stored Procedures

#### 1. Speaking Script & Topic Breakdown
> "Respected teachers, my name is Muhammad Hammad. My section covers our Relational SQL Query Implementations and Advanced DBMS Objects.
>
> In this project, all business logic and data aggregation are executed inside MySQL through optimized SQL queries rather than in JavaScript memory.
>
> **Key SQL Concepts Implemented:**
> 1. **Multi-Table JOINs:** Our billing query uses a 5-table join (`orders`, `order_items`, `menu_items`, `restaurant_tables`, and `staff`) to generate comprehensive customer receipts.
> 2. **Aggregations & GROUP BY:** Our sales analytics queries use `COUNT()`, `SUM()`, `AVG()`, `MIN()`, and `MAX()`. For example, our Category Sales breakdown groups sales by category and applies a `HAVING` clause to filter high-volume sections.
> 3. **Subqueries:** We implemented scalar subqueries to locate orders exceeding the restaurant's average ticket size, and correlated `NOT EXISTS` subqueries to detect menu items that have never been ordered.
> 4. **Database Views:**
>    - `v_daily_sales_report`: Pre-computes gross sales, billed counts, and tax collected.
>    - `v_item_sales_ranking`: Ranks menu items by units sold and gross sales.
>    - `v_table_occupancy_current`: Provides real-time table status joined with active order numbers and elapsed minutes.
> 5. **Database Triggers:** We created `trg_order_status_audit` which fires `AFTER UPDATE ON orders`. Whenever an order's status transitions, the trigger automatically inserts an immutable record into `order_status_history`.
> 6. **Stored Procedures:** `sp_settle_order_payment` encapsulates the payment insertion, order status update to 'billed', and table release to 'available' in an atomic procedure."

#### 2. Key Code / Schema Touchpoints
- Reference: `database/views.sql` (4 views).
- Reference: `database/triggers.sql` (`trg_order_status_audit` and `trg_sync_table_status_on_order`).
- Reference: `database/procedures.sql` (`sp_recalculate_order_totals`, `sp_settle_order_payment`).
- Reference: `database/annotated_queries.sql` (Queries 1 through 13).

#### 3. Likely Viva Questions & Technical Answers for Hammad
- **Q1: Explain the difference between `WHERE` and `HAVING` in your sales query.**  
  *Answer:* "`WHERE` filters individual rows before grouping takes place (e.g., `WHERE o.order_status = 'billed'`). `HAVING` filters grouped summary rows after aggregate functions are evaluated (e.g., `GROUP BY category_id HAVING SUM(oi.quantity) >= 5`)."
- **Q2: Why use a Database View instead of querying the base tables directly each time?**  
  *Answer:* "A View provides logical data independence, encapsulates complex joins and aggregations into a reusable abstraction, and enforces security by allowing users or reports to view computed metrics without giving them direct access to underlying transactional tables."

---

## Member 4 — Abuzar (EB25210006010)
### Role: Application Workflows, ACID Transactions, Conflict Prevention & Verification

#### 1. Speaking Script & Topic Breakdown
> "Respected committee, I am Abuzar. I will be concluding our presentation with the Application Business Workflows, Database Transactions (ACID), Reservation Conflict Prevention, Security, and Automated Test Results.
>
> **1. Multi-Step ACID Order Transactions:**
> In our system, placing an order involves multiple steps:
> 1. Locking the table row using `SELECT ... FOR UPDATE`.
> 2. Verifying item availability and price in the database.
> 3. Inserting the master `orders` record.
> 4. Inserting multiple `order_items` records with frozen prices.
> 5. Synchronizing table status to `'occupied'`.
>
> All these steps are wrapped in a single database transaction (`START TRANSACTION ... COMMIT`). If any step fails (e.g. an item was marked unavailable), the entire transaction executes a `ROLLBACK`, guaranteeing zero orphan order records.
>
> **2. 2-Hour Reservation Conflict Prevention:**
> When scheduling a booking, our system executes an SQL validation check using `TIMESTAMPDIFF(MINUTE, reservation_time, ?)` with `ABS() < 120`. If an existing confirmed reservation exists for the same table within 2 hours, the database layer rejects the booking with an HTTP 409 Conflict.
>
> **3. Testing & Verification:**
> We wrote an automated integration test suite (`backend/tests/run_tests.js`). All **27 test assertions passed**:
> - Healthcheck & live database ping
> - JWT authentication & RBAC authorization
> - Table occupancy synchronization
> - Reservation conflict detection
> - Multi-item atomic order transactions
> - Lifecycle status validation (preventing illegal state reversals)
> - Duplicate payment prevention & automatic table release."

#### 2. Key Code / Schema Touchpoints
- Reference: `backend/src/repositories/ordersRepository.js` (`withTransaction` implementation).
- Reference: `backend/src/repositories/reservationsRepository.js` (`checkConflict` query).
- Reference: `backend/tests/run_tests.js` (Automated test suite).
- Reference: `docs/TEST_PLAN_AND_RESULTS.md`.

#### 3. Likely Viva Questions & Technical Answers for Abuzar
- **Q1: What are the ACID properties, and where did your system demonstrate them?**  
  *Answer:* 
  - **Atomicity:** All order item inserts succeed, or none do (using `START TRANSACTION` and `ROLLBACK`).
  - **Consistency:** Database check constraints (`price >= 0`, `quantity > 0`) and foreign keys prevent invalid states.
  - **Isolation:** `SELECT ... FOR UPDATE` prevents concurrent transactions from booking or seating guests at the same table simultaneously.
  - **Durability:** Committed transactions are persistently stored in MySQL InnoDB tables with write-ahead redo logging (`ib_logfile0`)."
- **Q2: How does the system handle table release after dining?**  
  *Answer:* "When payment is processed in `paymentsRepository.processPayment`, a transaction inserts the payment record, sets the order status to `'billed'`, and immediately sets `restaurant_tables.status = 'available'`. This guarantees that the table is freed in real-time for the next party."
