const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function seedDemo() {
  console.log('----------------------------------------------------');
  console.log('RESTAURANT MANAGEMENT SYSTEM — OPTIONAL DEMO SEEDER');
  console.log('----------------------------------------------------');

  try {
    const seedPath = path.resolve(__dirname, '../../../database/sample_seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Cannot find seed file at ${seedPath}`);
    }

    const sql = fs.readFileSync(seedPath, 'utf8')
      .replace(/^\s*--.*$/gm, '');

    // Split SQL into executable statements
    const statements = sql
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));

    console.log(`Executing ${statements.length} seed statements...`);

    for (const stmt of statements) {
      if (stmt.toLowerCase().startsWith('insert into')) {
        try {
          await pool.query(stmt);
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            console.log('[Notice] Demo rows already exist; skipping duplicate entries.');
          } else {
            throw err;
          }
        }
      }
    }

    // Now ensure we have both an admin account and a waiter account with known passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassHash = await bcrypt.hash('admin123', salt);
    const waiterPassHash = await bcrypt.hash('waiter123', salt);

    // 1. Admin account for Huzaifa (staff_id 1)
    const [staffHuzaifa] = await pool.query("SELECT staff_id FROM staff WHERE email = 'huzaifa@restaurant.local'");
    if (staffHuzaifa.length > 0) {
      const sId = staffHuzaifa[0].staff_id;
      const [acc] = await pool.query('SELECT account_id FROM staff_accounts WHERE staff_id = ?', [sId]);
      if (acc.length === 0) {
        await pool.query(
          "INSERT INTO staff_accounts (staff_id, username, password_hash, role) VALUES (?, 'admin', ?, 'admin')",
          [sId, adminPassHash]
        );
        console.log("[+] Created Admin login: username='admin', password='admin123'");
      }
    }

    // 2. Ensure the demo waiter exists even if another seeded staff row caused a duplicate
    let [staffHammad] = await pool.query(
      "SELECT staff_id FROM staff WHERE email = 'hammad@restaurant.local'"
    );
    if (staffHammad.length === 0) {
      const demoPhone = `DEMO-WAITER-${Date.now()}`;
      const [staffResult] = await pool.query(
        `INSERT INTO staff (full_name, role, phone, email, is_active)
         VALUES ('Muhammad Hammad', 'waiter', ?, 'hammad@restaurant.local', TRUE)`,
        [demoPhone]
      );
      staffHammad = [{ staff_id: staffResult.insertId }];
    }

    const waiterStaffId = staffHammad[0].staff_id;
    await pool.query(
      "UPDATE staff SET role = 'waiter', is_active = TRUE WHERE staff_id = ?",
      [waiterStaffId]
    );
    const [waiterUsername] = await pool.query(
      'SELECT account_id FROM staff_accounts WHERE username = ? AND staff_id != ?',
      ['waiter', waiterStaffId]
    );
    if (waiterUsername.length > 0) {
      throw new Error("Username 'waiter' is already assigned to a different staff member.");
    }

    await pool.query(
      `INSERT INTO staff_accounts (staff_id, username, password_hash, role, is_active)
       VALUES (?, 'waiter', ?, 'waiter', TRUE)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         is_active = TRUE`,
      [waiterStaffId, waiterPassHash]
    );
    console.log("[+] Waiter login is ready: username='waiter', password='waiter123'");

    console.log('====================================================');
    console.log('SUCCESS: Demo baseline seed loaded!');
    console.log('Logins available:');
    console.log('  Admin  : username = admin  / password = admin123');
    console.log('  Waiter : username = waiter / password = waiter123');
    console.log('====================================================');
  } catch (error) {
    console.error('[Error] Seed failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDemo();
