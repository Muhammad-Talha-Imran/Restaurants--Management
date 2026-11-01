# Restaurant Table & Order Management System (GourmetOS)

> **Database Management System (DBMS) Final University Project**  
> A complete, professional, full-stack database-driven restaurant operations and order management web application.

---

## 👥 Group Members

| Name | Student ID | Designated Viva Presentation Domain |
| :--- | :--- | :--- |
| **Muhammad Huzaifa** | `EB25210006062` | System Architecture, Scope & Full-Stack Interface Walkthrough |
| **Muhammad Talha Imran**| `EB25210006073` | Relational Database Design, ERD, Constraints & Normalization (3NF/BCNF) |
| **Muhammad Hammad** | `EB25210006056` | SQL Queries, Joins, Aggregations, Views, Triggers & Stored Procedures |
| **Abuzar** | `EB25210006010` | Business Workflows, ACID Transactions, Conflict Prevention & Testing |

---

## 🌟 System Features & Functional Modules

1. **Table Management Module**:
   - Visual floor plan and grid layout displaying seating capacity and real-time status (`available`, `occupied`, `reserved`).
   - Add, edit, and safely deactivate tables.
   - Synchronizes automatically with active dining orders.

2. **Menu & Category Management Module**:
   - Categorized menu catalog (Starters, Main Course, Burgers, Beverages, Desserts).
   - Real-time item price management and kitchen availability toggle.
   - Category management with foreign-key referential integrity protection.

3. **Order Management Module**:
   - Multi-step interactive order wizard with table selection or takeaway.
   - Live cart with automated subtotal and 5% sales tax calculation.
   - **ACID Transaction Guarantee**: Order and item lines are created atomically with frozen historical unit prices.

4. **Kitchen Display System (KDS)**:
   - Dedicated kitchen queue for cooks to track incoming tickets (`placed` &rarr; `preparing` &rarr; `served`).
   - Clear item quantities and special customer instructions.

5. **Reservation Management Module**:
   - Scheduling calendar linking customers to dining tables.
   - **2-Hour Conflict Prevention**: Rejects overlapping bookings for the same table within 120 minutes with HTTP 409.
   - Customer auto-linking by phone number.

6. **Payment & Billing Management Module**:
   - Itemized bill generator with printable customer receipts.
   - Strict **1-to-1 relationship** between orders and payments enforced by database constraints.
   - Automatic table release upon payment settlement.

7. **Staff Management Module (Admin)**:
   - Employee directory with role assignments (Admin, Manager, Waiter, Cashier, Kitchen).
   - Secure account provisioning with bcrypt password hashing.

8. **Customer Directory Module**:
   - Contact records linked with historical orders and reservation counts.

9. **Executive Dashboard & SQL Analytics (Admin)**:
   - Real-time KPIs (Gross Revenue, Orders Today, Floor Occupancy, Upcoming Reservations).
   - Daily sales breakdowns from view `v_daily_sales_report`.
   - Best-selling menu items from view `v_item_sales_ranking`.
   - Category sales distribution and staff sales performance.

---

## 🛠️ Technology Stack

- **Frontend:** React 18 with Vite, Vanilla CSS with custom design tokens, Lucide Icons.
- **Backend:** Node.js & Express.js (Layered Repository Pattern).
- **Database:** MySQL / MariaDB (InnoDB Engine, UTF-8 Unicode).
- **Database Driver:** `mysql2/promise` with Connection Pooling.
- **Authentication:** JSON Web Tokens (JWT) & `bcryptjs` password hashing.
- **API Architecture:** RESTful JSON APIs with parameterized queries.

---

## 📁 Repository Structure

```
DBMS Project AI/
├── backend/                        # Node.js & Express REST API
│   ├── src/
│   │   ├── config/database.js      # MySQL connection pool & transaction helper
│   │   ├── controllers/            # Route request handlers
│   │   ├── middleware/             # JWT auth, RBAC & centralized error handlers
│   │   ├── repositories/           # Parameterized SQL query layers
│   │   ├── routes/                 # RESTful route definitions
│   │   ├── scripts/
│   │   │   ├── initAdmin.js        # Secure Administrator initialization script
│   │   │   └── seedDemo.js         # Optional development baseline seeder
│   │   └── server.js               # Main Express application entry point
│   ├── tests/
│   │   └── run_tests.js            # Automated integration test suite (27 tests)
│   ├── .env.example                # Environment variables template
│   └── package.json
│
├── frontend/                       # React.js + Vite Web Application
│   ├── src/
│   │   ├── api/client.js           # API client with token interceptor
│   │   ├── components/             # Reusable UI (Sidebar, Header, Modal, Toast, Bill)
│   │   ├── context/AuthContext.jsx # Global user auth & role context
│   │   ├── pages/                  # Full-page modules (Dashboard, Tables, Orders, etc.)
│   │   ├── App.jsx                 # Master layout and role router
│   │   ├── index.css               # Curated dark slate & gold design system
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js              # Vite config with backend API proxy
│   └── package.json
│
├── database/                       # Relational Database SQL Scripts
│   ├── schema.sql                  # Table definitions, PK/FK constraints & indexes
│   ├── views.sql                   # Reporting views (v_daily_sales_report, etc.)
│   ├── triggers.sql                # Audit & status synchronization triggers
│   ├── procedures.sql              # Atomic billing & payment stored procedures
│   ├── sample_seed.sql             # Optional baseline categories, tables, menu
│   └── annotated_queries.sql       # Academic collection for viva demonstration
│
├── docs/                           # Academic Project Deliverables
│   ├── ERD.md                      # Mermaid diagram & cardinality matrix
│   ├── SCHEMA_AND_DATA_DICTIONARY.md # Comprehensive data dictionary for 11 tables
│   ├── NORMALIZATION.md            # 1NF, 2NF, 3NF & BCNF academic analysis
│   ├── ANNOTATED_SQL_QUERIES.md    # CRUD, Joins, Aggregates, Subqueries, EXPLAIN
│   ├── API_DOCUMENTATION.md        # Full REST API endpoint specification
│   ├── PRESENTATION_AND_VIVA_GUIDE.md # 4-member speaking guide & viva Q&A
│   └── TEST_PLAN_AND_RESULTS.md    # 27 passing automated test results
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Setup & Installation Guide

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MySQL Server** or **MariaDB Server** (v8.0+ or v10.5+) running on port `3306`.

### 2. Configure Database
Open your MySQL / MariaDB command line or Workbench and run the database creation and schema scripts:

```bash
# Connect to MySQL and source the schema files in order:
mysql -u root -p
```
Inside MySQL:
```sql
SOURCE database/schema.sql;
SOURCE database/views.sql;
SOURCE database/triggers.sql;
SOURCE database/procedures.sql;

-- (Optional) Load baseline demo categories, tables, and dishes for testing:
SOURCE database/sample_seed.sql;
```

### 3. Backend Setup
1. Navigate to the `backend/` directory:
```bash
cd backend
```
2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Verify that `DB_USER`, `DB_PASSWORD`, `DB_PORT`, and `DB_NAME=restaurant_db` match your local MySQL configuration).*

3. Install backend dependencies:
```bash
npm install
```

4. Initialize the initial Administrator account:
```bash
npm run init:admin
# Creates Administrator account: username 'admin', password 'admin123'
```
*(Or run `npm run seed:demo` to initialize both `admin` and `waiter` accounts).*

5. Start the backend server:
```bash
npm run dev
# Server starts on http://localhost:5000
```

### 4. Frontend Setup
1. Open a new terminal and navigate to `frontend/`:
```bash
cd frontend
```
2. Install frontend dependencies:
```bash
npm install
```
3. Start the Vite development server:
```bash
npm run dev
# Web application starts on http://localhost:3000
```

---

## 🧪 Running Automated Tests

We provide an automated integration test suite that tests all 27 critical database constraints, transactions, role permissions, and lifecycle rules:

```bash
cd backend
npm test
```

**Test Coverage Highlights:**
- Health check & database connection
- Admin & Waiter JWT authentication and RBAC restriction
- Table listing and floor occupancy tracking
- Menu search with price bounds
- Reservation conflict detection (rejects overlapping booking within 2 hours with HTTP 409)
- Multi-item atomic order placement (ACID transaction)
- Table status sync to `'occupied'`
- Status transition lifecycle validation (rejects invalid reverse transitions)
- Payment settlement in an ACID transaction
- Duplicate payment prevention (strictly 1:1)
- Automatic table release back to `'available'`
- Live SQL aggregation queries and view verification

---

## 🔑 Default Login Credentials for Demonstration

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full access to Dashboard, Staff, Tables, Menu, Orders, Billing, Reports |
| **Waiter / Staff** | `waiter` | `waiter123` | Operational access to Floor, Menu, Orders, Kitchen, Reservations, Billing |

*(One-click demo login buttons are also provided directly on the Login screen).*

---

## 📚 Academic Documentation Deliverables

For the final university evaluation and viva defense, inspect the documents in `docs/`:
- **[Entity-Relationship Diagram (ERD)](docs/ERD.md)** — Relational model and cardinalities.
- **[Schema & Data Dictionary](docs/SCHEMA_AND_DATA_DICTIONARY.md)** — 11 tables, constraints, keys, and indexes.
- **[Normalization Analysis](docs/NORMALIZATION.md)** — Step-by-step breakdown from 1NF to 3NF & BCNF.
- **[Annotated SQL Queries](docs/ANNOTATED_SQL_QUERIES.md)** — CRUD, multi-table joins, aggregates, subqueries, and EXPLAIN query plans.
- **[REST API Documentation](docs/API_DOCUMENTATION.md)** — Full specification of all REST endpoints.
- **[Presentation & Viva Guide](docs/PRESENTATION_AND_VIVA_GUIDE.md)** — Individual speaking guides for Huzaifa, Talha, Hammad, and Abuzar.
- **[Test Plan & Results](docs/TEST_PLAN_AND_RESULTS.md)** — Automated test logs and verification report.
