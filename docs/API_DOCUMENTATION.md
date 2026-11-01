# REST API Documentation

## Project: Restaurant Table & Order Management System
**Base URL:** `http://localhost:5000/api`  
**Authentication:** HTTP Bearer Token (`Authorization: Bearer <JWT>`)  
**Data Format:** JSON (`application/json`)

---

## 1. System Health Check

### `GET /health`
Verifies that the Express API and MySQL connection pool are healthy.
- **Access:** Public
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-25T17:14:46.610Z",
  "uptimeSeconds": 804,
  "database": {
    "connected": true,
    "version": "13.0.2-MariaDB",
    "database": "restaurant_db"
  },
  "environment": "development"
}
```

---

## 2. Authentication Module

### `POST /auth/login`
Authenticates a staff member and issues a 24-hour signed JWT token.
- **Access:** Public
- **Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "account_id": 1,
      "staff_id": 1,
      "username": "admin",
      "full_name": "Muhammad Huzaifa",
      "email": "huzaifa@restaurant.local",
      "role": "admin"
    }
  }
}
```

### `GET /auth/me`
Retrieves currently authenticated user profile from token.
- **Access:** Authenticated (`Bearer <JWT>`)

---

## 3. Table Management Module

### `GET /tables`
Retrieves all dining tables with optional status and capacity filtering.
- **Access:** Authenticated
- **Query Parameters:**
  - `status` (string, optional: `available`, `occupied`, `reserved`)
  - `minCapacity` (int, optional)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "table_id": 1,
      "table_number": "T-01",
      "capacity": 2,
      "status": "available",
      "location_notes": "Indoor - Window View",
      "is_active": 1,
      "active_order_id": null
    }
  ]
}
```

### `POST /tables`
Creates a new restaurant table.
- **Access:** Admin / Manager
- **Request Body:**
```json
{
  "table_number": "T-11",
  "capacity": 4,
  "status": "available",
  "location_notes": "Garden Patio"
}
```

### `PATCH /tables/:id/status`
Updates table availability directly.
- **Access:** Authenticated (Staff / Admin)
- **Request Body:**
```json
{ "status": "occupied" }
```

### `DELETE /tables/:id`
Deletes or safely soft-deactivates table if historical orders or reservations exist.
- **Access:** Admin only

---

## 4. Menu & Category Management Module

### `GET /categories`
Lists all menu categories with item count aggregations.

### `POST /categories`
Creates a new menu category (Admin).

### `GET /menu`
Queries menu items with database search, category filtering, price bounds, sorting, and pagination.
- **Query Parameters:**
  - `category_id` (int)
  - `search` (string)
  - `minPrice` (decimal), `maxPrice` (decimal)
  - `sortBy` (`name`, `price`, `created_at`), `sortOrder` (`ASC`, `DESC`)
  - `page` (int), `limit` (int)

### `POST /menu`
Creates a new dish or drink item (Admin).

### `PATCH /menu/:id/toggle`
Toggles item kitchen availability (`is_available` between true and false).

---

## 5. Reservation Management Module

### `GET /reservations`
Lists scheduled bookings with date and status filters.

### `POST /reservations`
Creates a new reservation with 2-hour table conflict check and party size validation.
- **Request Body:**
```json
{
  "table_id": 1,
  "customer_name": "Kamran Malik",
  "customer_phone": "+92-321-9876543",
  "customer_email": "kamran@example.com",
  "reservation_time": "2026-10-26 19:00:00",
  "party_size": 2,
  "special_requests": "Window preference"
}
```
- **Response `409 Conflict` (if table already reserved within 2 hours):**
```json
{
  "success": false,
  "error": "Error",
  "message": "Time slot conflict: Table already reserved at 2026-10-26 19:30:00 for customer 'Zainab'. Please select another time or table."
}
```

### `PATCH /reservations/:id/status`
Transitions reservation status (`confirmed`, `completed`, `cancelled`, `no_show`).

---

## 6. Order Management Module

### `GET /orders`
Queries orders with status, date, staff, and table filtering.

### `GET /orders/:id`
Returns master order record, order line items, current bill amounts, payment record, and status audit history.

### `POST /orders`
Places an order with order lines inside an ACID transaction.
- **Request Body:**
```json
{
  "table_id": 1,
  "order_type": "dine_in",
  "customer_name": "Hamza Ali",
  "customer_phone": "+92-300-1234567",
  "notes": "Fast service please",
  "items": [
    { "item_id": 1, "quantity": 2, "special_instructions": "Extra sauce" },
    { "item_id": 9, "quantity": 1 }
  ]
}
```

### `PATCH /orders/:id/status`
Enforces strict lifecycle transitions (`placed` &rarr; `preparing` &rarr; `served` &rarr; `billed`).

---

## 7. Payments & Billing Module

### `GET /payments`
Queries completed payment records with method and date filtering.

### `POST /payments`
Settles payment for an order and automatically releases table to `available`.
- **Request Body:**
```json
{
  "order_id": 1,
  "amount_paid": 28.35,
  "payment_method": "card",
  "transaction_reference": "CARD-AUTH-98765"
}
```

---

## 8. Reports & Analytics Module (Admin Only)

### `GET /reports/dashboard`
Returns live KPI summary (total orders, total revenue, table occupancy breakdown, upcoming reservations).

### `GET /reports/sales?startDate=...&endDate=...`
Returns daily sales aggregations from view `v_daily_sales_report`.

### `GET /reports/top-items?limit=10`
Returns top selling dishes from view `v_item_sales_ranking`.

### `GET /reports/category-sales`
Returns category distribution using `GROUP BY categories.category_id`.

### `GET /reports/staff-performance`
Returns staff activity and revenue handled.
