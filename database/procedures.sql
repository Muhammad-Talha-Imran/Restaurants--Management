-- ============================================================================
-- DATABASE MANAGEMENT SYSTEM (DBMS) FINAL PROJECT
-- File: procedures.sql
-- Stored Procedures for Complex Business Logic & Atomic Billing Workflows
-- ============================================================================

USE `restaurant_db`;

DROP PROCEDURE IF EXISTS `sp_recalculate_order_totals`;
DROP PROCEDURE IF EXISTS `sp_settle_order_payment`;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- Procedure 1: sp_recalculate_order_totals
-- Recalculates subtotal, tax, and final amount for an order from its item lines
-- ----------------------------------------------------------------------------
CREATE PROCEDURE `sp_recalculate_order_totals`(
    IN p_order_id INT,
    IN p_tax_rate DECIMAL(5, 2),
    IN p_discount DECIMAL(10, 2)
)
BEGIN
    DECLARE v_subtotal DECIMAL(10, 2) DEFAULT 0.00;
    DECLARE v_tax DECIMAL(10, 2) DEFAULT 0.00;
    DECLARE v_final DECIMAL(10, 2) DEFAULT 0.00;

    -- Aggregate subtotal from valid order items
    SELECT COALESCE(SUM(subtotal), 0.00)
    INTO v_subtotal
    FROM `order_items`
    WHERE `order_id` = p_order_id AND `status` != 'cancelled';

    -- Compute tax
    SET v_tax = ROUND(v_subtotal * (p_tax_rate / 100.0), 2);

    -- Compute final with discount protection
    IF p_discount > (v_subtotal + v_tax) THEN
        SET v_final = 0.00;
    ELSE
        SET v_final = (v_subtotal + v_tax) - p_discount;
    END IF;

    -- Update order record
    UPDATE `orders`
    SET 
        `subtotal` = v_subtotal,
        `tax_amount` = v_tax,
        `discount_amount` = p_discount,
        `final_amount` = v_final,
        `updated_at` = NOW()
    WHERE `order_id` = p_order_id;

    -- Return the updated totals
    SELECT v_subtotal AS subtotal, v_tax AS tax_amount, p_discount AS discount_amount, v_final AS final_amount;
END$$

-- ----------------------------------------------------------------------------
-- Procedure 2: sp_settle_order_payment
-- Atomically processes payment, transitions order status, and frees table
-- Demonstrates: Transactions (COMMIT/ROLLBACK), Error Handlers, Relational Sync
-- ----------------------------------------------------------------------------
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
    DECLARE v_current_status VARCHAR(20);
    DECLARE v_order_exists INT DEFAULT 0;
    DECLARE v_payment_exists INT DEFAULT 0;

    -- Declare rollback exit on SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'ERROR: Transaction failed. Database rolled back.';
    END;

    START TRANSACTION;

    -- Check if order exists
    SELECT COUNT(*), table_id, order_status
    INTO v_order_exists, v_table_id, v_current_status
    FROM `orders`
    WHERE `order_id` = p_order_id
    GROUP BY table_id, order_status;

    IF v_order_exists = 0 THEN
        ROLLBACK;
        SET p_status = 'ERROR: Order not found.';
    ELSE
        -- Check if payment already exists
        SELECT COUNT(*) INTO v_payment_exists
        FROM `payments`
        WHERE `order_id` = p_order_id;

        IF v_payment_exists > 0 THEN
            ROLLBACK;
            SET p_status = 'ERROR: Order has already been paid.';
        ELSE
            -- 1. Insert payment record
            INSERT INTO `payments` (
                `order_id`,
                `amount_paid`,
                `payment_method`,
                `payment_status`,
                `transaction_reference`,
                `payment_time`,
                `received_by_staff_id`
            ) VALUES (
                p_order_id,
                p_amount,
                p_method,
                'paid',
                p_ref,
                NOW(),
                p_staff_id
            );

            -- 2. Update order status to 'billed'
            UPDATE `orders`
            SET `order_status` = 'billed',
                `updated_at` = NOW()
            WHERE `order_id` = p_order_id;

            -- 3. Release associated table to 'available'
            IF v_table_id IS NOT NULL THEN
                UPDATE `restaurant_tables`
                SET `status` = 'available'
                WHERE `table_id` = v_table_id;
            END IF;

            COMMIT;
            SET p_status = 'SUCCESS: Payment recorded and table released.';
        END IF;
    END IF;
END$$

DELIMITER ;
