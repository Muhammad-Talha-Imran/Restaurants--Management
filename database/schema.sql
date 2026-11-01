-- ============================================================================
-- DATABASE MANAGEMENT SYSTEM (DBMS) FINAL PROJECT
-- Project Title: Restaurant Table & Order Management System
-- Group Members:
--   1. Muhammad Huzaifa (EB25210006062)
--   2. Muhammad Talha Imran (EB25210006073)
--   3. Muhammad Hammad (EB25210006056)
--   4. Abuzar (EB25210006010)
-- File: schema.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `restaurant_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `restaurant_db`;

-- ----------------------------------------------------------------------------
-- Drop existing tables in reverse dependency order to preserve FK integrity
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_status_history`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `reservations`;
DROP TABLE IF EXISTS `staff_accounts`;
DROP TABLE IF EXISTS `staff`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `menu_items`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `restaurant_tables`;

-- ============================================================================
-- 1. RESTAURANT TABLES (Table Management Module)
-- ============================================================================
CREATE TABLE `restaurant_tables` (
  `table_id` INT AUTO_INCREMENT PRIMARY KEY,
  `table_number` VARCHAR(20) NOT NULL UNIQUE,
  `capacity` INT NOT NULL,
  `status` ENUM('available', 'occupied', 'reserved') NOT NULL DEFAULT 'available',
  `location_notes` VARCHAR(100) NULL COMMENT 'e.g. Window, Main Hall, Patio, VIP',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `chk_table_capacity` CHECK (`capacity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. CATEGORIES (Category Management Module)
-- ============================================================================
CREATE TABLE `categories` (
  `category_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. MENU ITEMS (Menu Management Module)
-- ============================================================================
CREATE TABLE `menu_items` (
  `item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `image_url` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `chk_menu_price` CHECK (`price` >= 0),
  CONSTRAINT `fk_menu_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`category_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. CUSTOMERS (Customer & Reservation Management)
-- ============================================================================
CREATE TABLE `customers` (
  `customer_id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(25) NOT NULL UNIQUE,
  `email` VARCHAR(100) NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. STAFF (Staff Management Module)
-- ============================================================================
CREATE TABLE `staff` (
  `staff_id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'waiter', 'cashier', 'kitchen', 'manager') NOT NULL DEFAULT 'waiter',
  `phone` VARCHAR(25) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. STAFF ACCOUNTS / USERS (Authentication & Role-Based Access)
-- ============================================================================
CREATE TABLE `staff_accounts` (
  `account_id` INT AUTO_INCREMENT PRIMARY KEY,
  `staff_id` INT NOT NULL UNIQUE,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'waiter', 'cashier', 'kitchen', 'manager') NOT NULL DEFAULT 'waiter',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `last_login` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_staff_account` FOREIGN KEY (`staff_id`)
    REFERENCES `staff` (`staff_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. RESERVATIONS (Reservation Management Module)
-- ============================================================================
CREATE TABLE `reservations` (
  `reservation_id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `table_id` INT NOT NULL,
  `reservation_time` DATETIME NOT NULL,
  `party_size` INT NOT NULL,
  `status` ENUM('confirmed', 'cancelled', 'completed', 'no_show') NOT NULL DEFAULT 'confirmed',
  `special_requests` VARCHAR(255) NULL,
  `created_by_staff_id` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `chk_reservation_party_size` CHECK (`party_size` > 0),
  CONSTRAINT `fk_reservation_customer` FOREIGN KEY (`customer_id`)
    REFERENCES `customers` (`customer_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_reservation_table` FOREIGN KEY (`table_id`)
    REFERENCES `restaurant_tables` (`table_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_reservation_staff` FOREIGN KEY (`created_by_staff_id`)
    REFERENCES `staff` (`staff_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. ORDERS (Order Management Module)
-- ============================================================================
CREATE TABLE `orders` (
  `order_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(30) NOT NULL UNIQUE,
  `table_id` INT NULL COMMENT 'Nullable for takeout orders',
  `staff_id` INT NOT NULL,
  `customer_id` INT NULL COMMENT 'Nullable for walk-in orders',
  `order_type` ENUM('dine_in', 'takeaway') NOT NULL DEFAULT 'dine_in',
  `order_status` ENUM('placed', 'preparing', 'served', 'billed', 'cancelled') NOT NULL DEFAULT 'placed',
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `final_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `notes` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `chk_orders_subtotal` CHECK (`subtotal` >= 0),
  CONSTRAINT `chk_orders_tax` CHECK (`tax_amount` >= 0),
  CONSTRAINT `chk_orders_discount` CHECK (`discount_amount` >= 0),
  CONSTRAINT `chk_orders_final` CHECK (`final_amount` >= 0),
  CONSTRAINT `fk_order_table` FOREIGN KEY (`table_id`)
    REFERENCES `restaurant_tables` (`table_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_order_staff` FOREIGN KEY (`staff_id`)
    REFERENCES `staff` (`staff_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_order_customer` FOREIGN KEY (`customer_id`)
    REFERENCES `customers` (`customer_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. ORDER ITEMS (Order Item Management Module)
-- ============================================================================
CREATE TABLE `order_items` (
  `order_item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL COMMENT 'Preserves frozen historical price',
  `subtotal` DECIMAL(10, 2) NOT NULL,
  `special_instructions` VARCHAR(255) NULL,
  `status` ENUM('pending', 'preparing', 'served', 'cancelled') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `chk_order_item_quantity` CHECK (`quantity` > 0),
  CONSTRAINT `chk_order_item_unit_price` CHECK (`unit_price` >= 0),
  CONSTRAINT `chk_order_item_subtotal` CHECK (`subtotal` >= 0),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`)
    REFERENCES `orders` (`order_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_menu_item` FOREIGN KEY (`item_id`)
    REFERENCES `menu_items` (`item_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. PAYMENTS (Payment Management Module — Strict 1-to-1 with Orders)
-- ============================================================================
CREATE TABLE `payments` (
  `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL UNIQUE COMMENT 'Unique constraint enforces 1-to-1 relationship with orders',
  `amount_paid` DECIMAL(10, 2) NOT NULL,
  `payment_method` ENUM('cash', 'card', 'online', 'other') NOT NULL DEFAULT 'cash',
  `payment_status` ENUM('paid', 'refunded', 'failed') NOT NULL DEFAULT 'paid',
  `transaction_reference` VARCHAR(100) NULL,
  `payment_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `received_by_staff_id` INT NULL,
  `notes` VARCHAR(255) NULL,
  CONSTRAINT `chk_payment_amount` CHECK (`amount_paid` >= 0),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`)
    REFERENCES `orders` (`order_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_payment_staff` FOREIGN KEY (`received_by_staff_id`)
    REFERENCES `staff` (`staff_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. ORDER STATUS HISTORY (Audit Trail & DBMS Triggers)
-- ============================================================================
CREATE TABLE `order_status_history` (
  `history_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `old_status` VARCHAR(20) NULL,
  `new_status` VARCHAR(20) NOT NULL,
  `changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` VARCHAR(255) NULL,
  CONSTRAINT `fk_history_order` FOREIGN KEY (`order_id`)
    REFERENCES `orders` (`order_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PERFORMANCE & FILTER INDEXES (Academic Demonstration of Indexing Concepts)
-- ============================================================================
CREATE INDEX `idx_orders_table_status` ON `orders` (`table_id`, `order_status`);
CREATE INDEX `idx_orders_created` ON `orders` (`created_at`);
CREATE INDEX `idx_orders_staff` ON `orders` (`staff_id`);
CREATE INDEX `idx_reservations_datetime_table` ON `reservations` (`table_id`, `reservation_time`, `status`);
CREATE INDEX `idx_reservations_customer` ON `reservations` (`customer_id`);
CREATE INDEX `idx_menu_category_avail` ON `menu_items` (`category_id`, `is_available`);
CREATE INDEX `idx_payments_order` ON `payments` (`order_id`);
CREATE INDEX `idx_payments_time` ON `payments` (`payment_time`);
CREATE INDEX `idx_order_items_order` ON `order_items` (`order_id`);
