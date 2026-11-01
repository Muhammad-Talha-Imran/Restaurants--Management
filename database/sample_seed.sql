-- ============================================================================
-- DATABASE MANAGEMENT SYSTEM (DBMS) FINAL PROJECT
-- Group Members:
--   1. Muhammad Huzaifa (EB25210006062)
--   2. Muhammad Talha Imran (EB25210006073)
--   3. Muhammad Hammad (EB25210006056)
--   4. Abuzar (EB25210006010)
-- File: sample_seed.sql
-- DEMO DATASET (Pakistani Restaurant Context & PKR Pricing)
-- ============================================================================

USE `restaurant_db`;

-- ----------------------------------------------------------------------------
-- 1. Initial Categories
-- ----------------------------------------------------------------------------
INSERT INTO `categories` (`category_id`, `name`, `description`) VALUES
(1, 'Desi Karahi & Handi', 'Traditional chicken & mutton karahi, handi and gravies cooked with desi ghee and aromatic spices'),
(2, 'BBQ & Grills', 'Charcoal grilled chicken tikka, seekh kababs, malai boti and Peshawar chapli kabab'),
(3, 'Biryani & Rice', 'Special chicken and mutton biryani cooked in long-grain basmati rice with raita'),
(4, 'Burgers & Rolls', 'Crispy chicken zinger, garlic mayo paratha rolls and club sandwiches with fries'),
(5, 'Tandoor & Breads', 'Freshly baked roghani naan, garlic naan, tandoori roti and fresh salad'),
(6, 'Beverages & Chai', 'Karak doodh patti chai, fresh mint margarita, sweet lassi, and cold drinks'),
(7, 'Traditional Desserts', 'Hot gulab jamun, shahi kheer, and traditional matka kulfi');

-- ----------------------------------------------------------------------------
-- 2. Restaurant Tables
-- ----------------------------------------------------------------------------
INSERT INTO `restaurant_tables` (`table_number`, `capacity`, `status`, `location_notes`) VALUES
('T-01', 2, 'available', 'Main Hall - Window View'),
('T-02', 2, 'available', 'Main Hall - Window View'),
('T-03', 4, 'available', 'Main Dining Hall'),
('T-04', 4, 'available', 'Main Dining Hall'),
('T-05', 6, 'available', 'Family Section - Booth A'),
('T-06', 6, 'available', 'Family Section - Booth B'),
('T-07', 8, 'available', 'VIP Executive Lounge'),
('T-08', 4, 'available', 'Rooftop Terrace'),
('T-09', 4, 'available', 'Rooftop Terrace'),
('T-10', 4, 'available', 'Outdoor Lawn Garden');

-- ----------------------------------------------------------------------------
-- 3. Initial Staff Members (University Group Members + Operational Staff)
-- ----------------------------------------------------------------------------
INSERT INTO `staff` (`full_name`, `role`, `phone`, `email`) VALUES
('Muhammad Huzaifa', 'admin', '+92-300-1111111', 'huzaifa@restaurant.local'),
('Muhammad Talha Imran', 'manager', '+92-300-2222222', 'talha@restaurant.local'),
('Muhammad Hammad', 'waiter', '+92-300-3333333', 'hammad@restaurant.local'),
('Abuzar', 'cashier', '+92-300-4444444', 'abuzar@restaurant.local'),
('Chef Ali Raza', 'kitchen', '+92-300-5555555', 'kitchen@restaurant.local');

-- ----------------------------------------------------------------------------
-- 4. Sample Menu Items (Prices in Pakistani Rupees - Rs.)
-- ----------------------------------------------------------------------------
INSERT INTO `menu_items` (`category_id`, `name`, `description`, `price`, `is_available`) VALUES
-- 1: Desi Karahi & Handi
(1, 'Chicken Karahi (Full)', 'Fresh chicken cooked with fresh tomatoes, ginger, green chilies, and black pepper in desi ghee', 1650.00, TRUE),
(1, 'Chicken Karahi (Half)', 'Half kg fresh chicken karahi prepared fresh on order with green chilies and julienne ginger', 950.00, TRUE),
(1, 'Mutton Karahi (Full)', 'Prime tender mutton cooked in traditional iron wok with fresh spices and butter', 2600.00, TRUE),
(1, 'Chicken Makhni Handi', 'Boneless chicken cubes simmered in rich creamy butter tomato gravy', 1100.00, TRUE),
(1, 'Daal Makhni / Daal Mash', 'Slow cooked lentils tempered with cumin, garlic and desi butter', 380.00, TRUE),

-- 2: BBQ & Grills
(2, 'Chicken Tikka (Leg Piece)', 'Quarter chicken leg marinated in spicy yogurt blend, charcoal roasted to perfection', 340.00, TRUE),
(2, 'Chicken Malai Boti (Plate)', 'Tender boneless chicken cubes marinated in fresh cream, cheese, and mild spices', 580.00, TRUE),
(2, 'Beef Seekh Kabab (4 pcs)', 'Minced beef blended with fresh herbs and spices, grilled on iron skewers', 520.00, TRUE),
(2, 'Peshawar Chapli Kabab', 'Traditional spiced shallow-fried beef minced patty with coriander and crushed tomatoes', 420.00, TRUE),

-- 3: Biryani & Rice
(3, 'Special Chicken Biryani (Double)', 'Long grain aromatic basmati rice layered with succulent chicken, potatoes and aromatic spices', 380.00, TRUE),
(3, 'Special Chicken Biryani (Single)', 'Single portion authentic chicken biryani served with zeera raita', 260.00, TRUE),
(3, 'Sindhi Mutton Biryani', 'Traditional Karachi-style spiced mutton biryani cooked on dum', 650.00, TRUE),
(3, 'Matka Biryani Special', 'Dum-cooked biryani served in traditional clay pot with roasted boiled eggs and special gravy', 480.00, TRUE),

-- 4: Burgers & Rolls
(4, 'Chicken Garlic Mayo Paratha Roll', 'Crispy fried chicken boti wrapped in crispy lachha paratha with garlic mayo sauce', 280.00, TRUE),
(4, 'Crispy Zinger Burger', 'Crunchy battered chicken fillet with iceberg lettuce and secret sauce in sesame bun', 420.00, TRUE),
(4, 'Club Sandwich with Fries', 'Triple layer toasted bread with shredded chicken, egg, cheese, and crispy salted fries', 380.00, TRUE),

-- 5: Tandoor & Breads
(5, 'Roghani Naan', 'Soft clay-oven baked naan brushed with butter and sprinkled with sesame seeds', 60.00, TRUE),
(5, 'Garlic Butter Naan', 'Hot tandoori naan coated with roasted minced garlic and melted butter', 80.00, TRUE),
(5, 'Plain Tandoori Roti', 'Whole wheat healthy roti baked fresh in clay tandoor', 25.00, TRUE),
(5, 'Fresh Zeera Raita & Salad', 'Chilled spiced yogurt with roasted cumin accompanied by fresh cucumber, onion & tomatoes', 100.00, TRUE),

-- 6: Beverages & Chai
(6, 'Karak Doodh Patti Chai', 'Traditional cooked strong milk tea brewed with cardamom and premium tea leaves', 90.00, TRUE),
(6, 'Cardamom Matka Chai', 'Steaming hot thick doodh patti served in unglazed baked clay cup', 130.00, TRUE),
(6, 'Fresh Mint Margarita', 'Refreshing blended Persian mint, lemon juice, black salt and soda', 220.00, TRUE),
(6, 'Sweet / Mango Lassi', 'Traditional chilled yogurt drink blended with cream and sweet essence', 180.00, TRUE),
(6, 'Cold Drink (500ml)', 'Chilled bottle / can (Pepsi, 7Up, Marinda, Pakola)', 90.00, TRUE),
(6, 'Mineral Water (Large)', 'Bottled premium purified drinking water 1.5 Litre', 80.00, TRUE),

-- 7: Traditional Desserts
(7, 'Hot Gulab Jamun (2 pcs)', 'Warm soft khoya dumplings soaked in rose water sugar syrup', 150.00, TRUE),
(7, 'Shahi Kheer Thali', 'Slow-cooked rice pudding infused with saffron, cardamom, and topped with sliced almonds', 180.00, TRUE),
(7, 'Matka Kulfi', 'Traditional frozen dense milk kulfi with pistachios and saffron in mini clay pot', 160.00, TRUE);

-- ----------------------------------------------------------------------------
-- 5. Sample Customers
-- ----------------------------------------------------------------------------
INSERT INTO `customers` (`full_name`, `phone`, `email`, `notes`) VALUES
('Kamran Malik', '+92-321-9876543', 'kamran@example.com', 'Prefers window seating'),
('Zainab Fatima', '+92-333-8765432', 'zainab@example.com', 'Family section preferred'),
('Usman Tariq', '+92-301-4455667', 'usman@example.com', 'Prefers mild spices in Karahi'),
('Ayesha Khan', '+92-345-1122334', 'ayesha@example.com', 'Regular customer');
