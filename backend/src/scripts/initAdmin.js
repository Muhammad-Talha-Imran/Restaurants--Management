const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

/**
 * Securely initialize the initial Administrator account
 * Usage: node src/scripts/initAdmin.js [username] [password] [email]
 */
async function initAdmin() {
  const username = process.argv[2] || process.env.ADMIN_DEFAULT_USER || 'admin';
  const password = process.argv[3] || process.env.ADMIN_DEFAULT_PASS || 'admin123';
  const email = process.argv[4] || 'admin@restaurant.local';
  const fullName = 'System Administrator (Huzaifa)';

  console.log('----------------------------------------------------');
  console.log('RESTAURANT MANAGEMENT SYSTEM — INITIAL ADMIN SETUP');
  console.log('----------------------------------------------------');
  console.log(`Target Username : ${username}`);
  console.log(`Target Email    : ${email}`);

  try {
    // 1. Check if admin account already exists
    const [existingUsers] = await pool.execute(
      'SELECT account_id, username FROM staff_accounts WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      console.log(`[OK] Administrator account '${username}' already exists (ID: ${existingUsers[0].account_id}).`);
      process.exit(0);
    }

    // 2. Find or create staff record for Administrator
    const [existingStaff] = await pool.execute(
      'SELECT staff_id FROM staff WHERE email = ?',
      [email]
    );

    let staffId;
    if (existingStaff.length > 0) {
      staffId = existingStaff[0].staff_id;
      console.log(`[+] Linked to existing staff record ID: ${staffId}`);
    } else {
      const [staffResult] = await pool.execute(
        `INSERT INTO staff (full_name, role, phone, email, is_active)
         VALUES (?, 'admin', '+92-300-1111111', ?, TRUE)`,
        [fullName, email]
      );
      staffId = staffResult.insertId;
      console.log(`[+] Created new staff record ID: ${staffId}`);
    }

    // 3. Hash password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insert staff_account
    const [accountResult] = await pool.execute(
      `INSERT INTO staff_accounts (staff_id, username, password_hash, role, is_active)
       VALUES (?, ?, ?, 'admin', TRUE)`,
      [staffId, username, passwordHash]
    );

    console.log('====================================================');
    console.log(`SUCCESS: Administrator account '${username}' created!`);
    console.log(`Account ID : ${accountResult.insertId}`);
    console.log('Role       : admin');
    console.log('====================================================');
  } catch (error) {
    console.error('[Error] Failed to initialize admin account:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initAdmin();
