-- ============================================================================
-- DATABASE MANAGEMENT SYSTEM (DBMS) FINAL PROJECT
-- File: triggers.sql
-- Database Triggers for Audit Logging & Table Status Synchronization
-- ============================================================================

USE `restaurant_db`;

DROP TRIGGER IF EXISTS `trg_order_status_audit`;
DROP TRIGGER IF EXISTS `trg_sync_table_status_on_order`;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- Trigger 1: trg_order_status_audit
-- Automatically records every order status change in the audit trail table
-- ----------------------------------------------------------------------------
CREATE TRIGGER `trg_order_status_audit`
AFTER UPDATE ON `orders`
FOR EACH ROW
BEGIN
    IF OLD.order_status <> NEW.order_status THEN
        INSERT INTO `order_status_history` (
            `order_id`,
            `old_status`,
            `new_status`,
            `changed_at`,
            `notes`
        ) VALUES (
            NEW.order_id,
            OLD.order_status,
            NEW.order_status,
            NOW(),
            CONCAT('Order transition from ', OLD.order_status, ' to ', NEW.order_status)
        );
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- Trigger 2: trg_sync_table_status_on_order
-- Ensures that when an active dine-in order is inserted, table becomes 'occupied'
-- ----------------------------------------------------------------------------
CREATE TRIGGER `trg_sync_table_status_on_order`
AFTER INSERT ON `orders`
FOR EACH ROW
BEGIN
    IF NEW.table_id IS NOT NULL AND NEW.order_status IN ('placed', 'preparing') THEN
        UPDATE `restaurant_tables`
        SET `status` = 'occupied'
        WHERE `table_id` = NEW.table_id AND `status` = 'available';
    END IF;
END$$

DELIMITER ;
