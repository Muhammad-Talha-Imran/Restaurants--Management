# Academic Normalization Analysis (1NF to 3NF & BCNF)

## Project: Restaurant Table & Order Management System
**Course:** Database Management System (DBMS)  
**Authors:** Muhammad Huzaifa, Muhammad Talha Imran, Muhammad Hammad, Abuzar

---

## 1. Overview of Relational Normalization

Normalization is the systematic process of organizing data in a relational database to minimize redundancy and eliminate insertion, update, and deletion anomalies.

Our schema for the **Restaurant Table & Order Management System** was designed from first principles to satisfy **Third Normal Form (3NF)** and **Boyce-Codd Normal Form (BCNF)** across all operational entities.

---

## 2. Step-by-Step Normalization Breakdown

### Unnormalized Form (UNF) — The Flat Paper Order Sheet
In a traditional manual restaurant system, a paper bill often contains:
```
OrderSheet(OrderNumber, OrderDate, TableNumber, TableCapacity, StaffName, StaffRole, CustomerName, CustomerPhone, Item1_Name, Item1_Price, Item1_Qty, Item2_Name, Item2_Price, Item2_Qty, TotalAmount, PaymentMethod)
```
**Anomalies in UNF:**
- **Repeating groups**: Multiple items and quantities written on one sheet.
- **Redundancy**: Table capacity and staff name duplicated on every order.
- **Insertion anomaly**: Cannot record a new menu dish or table unless an order is created.
- **Deletion anomaly**: Deleting an order erases customer or staff contact info.
- **Update anomaly**: If an employee changes phone number, dozens of past receipts must be manually edited.

---

### First Normal Form (1NF)
> **Definition:** A relation is in 1NF if and only if all domain values are atomic (indivisible) and there are no repeating groups. Each table must have a designated Primary Key.

**Applied to our schema:**
1. **Elimination of repeating items**: Decomposed `OrderSheet` into `orders` and `order_items`.
2. **Atomic attributes**:
   - `order_items` stores exactly one menu item per tuple with atomic attributes (`quantity`, `unit_price`, `subtotal`).
   - Customer phone, staff email, and table numbers are atomic scalar fields.
3. **Primary keys defined**: Every entity has a surrogate auto-increment integer primary key (`table_id`, `category_id`, `item_id`, `order_id`, `payment_id`, etc.).

---

### Second Normal Form (2NF)
> **Definition:** A relation is in 2NF if it is in 1NF and every non-prime attribute is fully functionally dependent on the entire primary key (no partial functional dependencies).

In relations with composite candidate keys, partial dependencies occur when an attribute depends on only a subset of the composite key:
- Consider a composite order line: `(order_id, item_id) -> (item_name, item_category, quantity, unit_price)`
- `quantity` depends on `(order_id, item_id)` (how many of that item were ordered in that specific order).
- However, `item_name` and `item_category` depend **only on `item_id`**, which is a partial dependency!

**Resolved in our design:**
- Separated `menu_items(item_id, category_id, name, description, price)` from `order_items(order_item_id, order_id, item_id, quantity, unit_price, subtotal)`.
- `item_name` and `category_id` are stored exclusively in `menu_items`.
- `order_items` depends solely on its primary key `order_item_id` (or the candidate key `(order_id, item_id)`).

---

### Third Normal Form (3NF)
> **Definition:** A relation is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on the primary key (no $X \rightarrow Y \rightarrow Z$ where $X$ is the primary key and $Y$ is a non-prime attribute).

**Examples of transitive dependencies eliminated:**

1. **Category Information**:
   - *Violation if unnormalized:* `item_id -> category_id -> category_name, category_description`
   - In `menu_items`, storing `category_name` would mean that `category_name` depends on `category_id`, which depends on `item_id`.
   - *Resolution:* Created a separate `categories(category_id, name, description)` relation. `menu_items` stores only the foreign key `category_id`.

2. **Customer Information in Reservations & Orders**:
   - *Violation if unnormalized:* `reservation_id -> customer_id -> customer_phone, customer_email`
   - *Resolution:* Extracted `customers(customer_id, full_name, phone, email, notes)`. `reservations` and `orders` only store `customer_id`.

3. **Staff Details in Orders**:
   - *Violation if unnormalized:* `order_id -> staff_id -> staff_full_name, staff_role, staff_phone`
   - *Resolution:* Extracted `staff(staff_id, full_name, role, phone, email)`. `orders` stores only `staff_id`.

4. **Authentication Credentials**:
   - Separated `staff_accounts(account_id, staff_id, username, password_hash, role)` from `staff` to prevent security credentials from being loaded during daily staff lookups.

---

### Boyce-Codd Normal Form (BCNF)
> **Definition:** A relation is in BCNF if for every non-trivial functional dependency $X \rightarrow Y$, $X$ is a superkey.

In every implemented table in our database (`restaurant_tables`, `categories`, `menu_items`, `customers`, `staff`, `staff_accounts`, `reservations`, `orders`, `order_items`, `payments`):
- All determinant attributes ($X$) are either the primary key or unique candidate keys (`table_number`, `username`, `phone`, `order_number`, `order_id` in payments).
- Hence, the schema strictly adheres to BCNF.

---

## 3. Deliberate, Justified Denormalization for Financial Integrity

In academic DBMS design, a common pitfall is over-normalizing financial transactions.

### The "Historical Price Anomaly" in Strict 3NF
In strict theoretical 3NF, one might argue that `unit_price` in `order_items` is redundant because `menu_items` already contains `price`:
$$\text{Line Subtotal} = \text{order\_items.quantity} \times \text{menu\_items.price}$$

**Why this breaks real restaurant operations:**
1. Suppose on Monday, a "Prime Ribeye Steak" costs **$25.00**. A guest orders 2 steaks, yielding a bill of **$50.00**.
2. On Friday, the restaurant updates `menu_items.price` to **$30.00** due to meat supplier inflation.
3. If `order_items` did not store `unit_price`, recalculating Monday's bill using a dynamic join with `menu_items.price` would produce **$60.00**!
4. Monday's accounting ledger, tax receipts, and payment records would be corrupted retroactively.

### Our Solution
We intentionally store `order_items.unit_price` at the time of order placement.
- It represents the **contractual price** agreed upon between restaurant and customer at timestamp $T$.
- Future changes to `menu_items.price` only affect orders placed after timestamp $T$.
- This preserves the auditability and mathematical correctness required by real-world financial databases.

Similarly, `orders` stores computed totals (`subtotal`, `tax_amount`, `final_amount`) synchronized through atomic transactions and stored procedures (`sp_recalculate_order_totals`), guaranteeing fast $O(1)$ dashboard queries without having to re-aggregate hundreds of thousands of order item lines on every page load.
