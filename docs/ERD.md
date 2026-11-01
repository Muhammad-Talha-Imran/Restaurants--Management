# Entity-Relationship Diagram (ERD) & Relational Model

## Project: Restaurant Table & Order Management System
**Course:** Database Management System (DBMS)  
**Group Members:**
- Muhammad Huzaifa (EB25210006062)
- Muhammad Talha Imran (EB25210006073)
- Muhammad Hammad (EB25210006056)
- Abuzar (EB25210006010)

---

## 1. Relational Entity-Relationship Diagram (Mermaid)

The following diagram represents the implemented MySQL relational schema in `restaurant_db`.

```mermaid
erDiagram
    CATEGORIES ||--o{ MENU_ITEMS : "classifies (1:N)"
    RESTAURANT_TABLES ||--o{ ORDERS : "hosts (1:N)"
    RESTAURANT_TABLES ||--o{ RESERVATIONS : "reserved_for (1:N)"
    CUSTOMERS ||--o{ RESERVATIONS : "makes (1:N)"
    CUSTOMERS ||--o{ ORDERS : "places (1:N, optional)"
    STAFF ||--o{ ORDERS : "takes_and_manages (1:N)"
    STAFF ||--o| STAFF_ACCOUNTS : "authenticates (1:1)"
    STAFF ||--o{ RESERVATIONS : "books (1:N, optional)"
    STAFF ||--o{ PAYMENTS : "receives (1:N, optional)"
    ORDERS ||--|{ ORDER_ITEMS : "contains (1:N)"
    ORDERS ||--|| PAYMENTS : "settled_by (1:1)"
    ORDERS ||--o{ ORDER_STATUS_HISTORY : "tracks_status (1:N)"
    MENU_ITEMS ||--o{ ORDER_ITEMS : "ordered_in (1:N)"

    CATEGORIES {
        int category_id PK
        string name UK
        string description
        boolean is_active
        datetime created_at
    }

    MENU_ITEMS {
        int item_id PK
        int category_id FK
        string name
        text description
        decimal price
        boolean is_available
        datetime created_at
        datetime updated_at
    }

    RESTAURANT_TABLES {
        int table_id PK
        string table_number UK
        int capacity
        enum status
        string location_notes
        boolean is_active
        datetime created_at
    }

    CUSTOMERS {
        int customer_id PK
        string full_name
        string phone UK
        string email
        string notes
        datetime created_at
    }

    STAFF {
        int staff_id PK
        string full_name
        enum role
        string phone UK
        string email UK
        boolean is_active
        datetime created_at
    }

    STAFF_ACCOUNTS {
        int account_id PK
        int staff_id FK, UK
        string username UK
        string password_hash
        enum role
        boolean is_active
        datetime last_login
        datetime created_at
    }

    RESERVATIONS {
        int reservation_id PK
        int customer_id FK
        int table_id FK
        datetime reservation_time
        int party_size
        enum status
        string special_requests
        int created_by_staff_id FK
        datetime created_at
        datetime updated_at
    }

    ORDERS {
        int order_id PK
        string order_number UK
        int table_id FK
        int staff_id FK
        int customer_id FK
        enum order_type
        enum order_status
        decimal subtotal
        decimal tax_amount
        decimal discount_amount
        decimal final_amount
        string notes
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEMS {
        int order_item_id PK
        int order_id FK
        int item_id FK
        int quantity
        decimal unit_price
        decimal subtotal
        string special_instructions
        enum status
        datetime created_at
    }

    PAYMENTS {
        int payment_id PK
        int order_id FK, UK
        decimal amount_paid
        enum payment_method
        enum payment_status
        string transaction_reference
        datetime payment_time
        int received_by_staff_id FK
        string notes
    }

    ORDER_STATUS_HISTORY {
        int history_id PK
        int order_id FK
        string old_status
        string new_status
        datetime changed_at
        string notes
    }
```

---

## 2. Entity Relationships and Cardinality Matrix

| Relationship | Cardinality | Foreign Key | Referential Action (ON DELETE) | Business Rule Enforced |
| :--- | :--- | :--- | :--- | :--- |
| `categories` &rarr; `menu_items` | **1 : N** | `menu_items.category_id` | `RESTRICT` | A category cannot be deleted if active menu items exist under it. |
| `restaurant_tables` &rarr; `orders` | **1 : N** | `orders.table_id` | `RESTRICT` | Table records with historical orders cannot be dropped; soft deactivation is used. |
| `restaurant_tables` &rarr; `reservations` | **1 : N** | `reservations.table_id` | `RESTRICT` | Preserves reservation history for all dining tables. |
| `customers` &rarr; `reservations` | **1 : N** | `reservations.customer_id` | `RESTRICT` | Reservations require a valid customer record. |
| `customers` &rarr; `orders` | **1 : N** | `orders.customer_id` | `SET NULL` | Nullable foreign key: supports walk-in customers without forcing registration. |
| `staff` &rarr; `orders` | **1 : N** | `orders.staff_id` | `RESTRICT` | Every order is accountable to an active staff member. |
| `staff` &rarr; `staff_accounts` | **1 : 1** | `staff_accounts.staff_id` | `CASCADE` | Unique constraint enforces strictly 1 system login account per employee. |
| `orders` &rarr; `order_items` | **1 : N** | `order_items.order_id` | `CASCADE` | When an order is deleted, its individual line items are removed. |
| `menu_items` &rarr; `order_items` | **1 : N** | `order_items.item_id` | `RESTRICT` | Historical order items cannot be deleted if a menu item is removed. Unit price is frozen. |
| `orders` &rarr; `payments` | **1 : 1** | `payments.order_id` | `RESTRICT` | **UNIQUE(order_id)** strictly guarantees that each order has exactly one payment record. |
| `orders` &rarr; `order_status_history` | **1 : N** | `order_status_history.order_id` | `CASCADE` | Populated automatically by database trigger `trg_order_status_audit`. |

---

## 3. Referential Actions & Integrity Justifications

1. **Strict 1-to-1 Order-to-Payment Cardinality**:
   The proposal explicitly specifies a one-to-one relationship between orders and payments. In MySQL, this is enforced by placing a `UNIQUE` constraint on `payments.order_id`. Any attempt to insert a second payment for the same order raises constraint error `ER_DUP_ENTRY`.

2. **Price Freezing in `order_items`**:
   The column `order_items.unit_price` stores the price of the item at the exact moment of order placement. If an administrator later updates `menu_items.price` in the menu catalog, historical bills, daily sales reports, and customer receipts remain mathematically unchanged.

3. **Walk-In Dine-In & Takeaway Support**:
   Foreign keys `orders.customer_id` and `orders.table_id` are deliberately nullable:
   - For takeaway orders, `table_id` is `NULL`.
   - For walk-in customers who do not provide their contact details, `customer_id` is `NULL`.
