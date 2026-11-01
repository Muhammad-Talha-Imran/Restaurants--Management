const http = require('http');
const app = require('../src/server');

const TEST_PORT = 5001;
let server;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('RESTAURANT MANAGEMENT SYSTEM — AUTOMATED INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Start test server
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, resolve);
  });

  try {
    // Test 1: Healthcheck
    console.log('1. Health Check Endpoint');
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200, 'Health endpoint returns HTTP 200');
    assert(health.body.database && health.body.database.connected === true, 'Database is connected to MariaDB/MySQL');

    // Test 2: Admin Login
    console.log('\n2. Authentication & JWT Issuance');
    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    assert(adminLogin.status === 200, 'Admin login succeeded with HTTP 200');
    assert(!!adminLogin.body.data?.token, 'JWT token returned in login response');
    const adminToken = adminLogin.body.data.token;

    // Test 3: Waiter Login
    const waiterLogin = await makeRequest('POST', '/api/auth/login', {
      username: 'waiter',
      password: 'waiter123'
    });
    assert(waiterLogin.status === 200, 'Waiter login succeeded with HTTP 200');
    const waiterToken = waiterLogin.body.data.token;

    // Test 4: Role-Based Access Control (RBAC)
    console.log('\n3. Role-Based Access Control (RBAC)');
    const waiterStaffAccess = await makeRequest('GET', '/api/staff', null, waiterToken);
    assert(waiterStaffAccess.status === 403, 'Waiter denied access to Staff Management endpoint (HTTP 403 Forbidden)');

    const adminStaffAccess = await makeRequest('GET', '/api/staff', null, adminToken);
    assert(adminStaffAccess.status === 200, 'Admin successfully granted access to Staff Management endpoint (HTTP 200)');

    // Test 5: Table Management
    console.log('\n4. Table Management & Status Queries');
    const tablesRes = await makeRequest('GET', '/api/tables', null, adminToken);
    assert(tablesRes.status === 200 && Array.isArray(tablesRes.body.data), 'Tables query returned list of tables');
    const testTable = tablesRes.body.data[0];
    assert(!!testTable, `Found test table ${testTable.table_number}`);

    // Test 6: Menu Items Search & Filter
    console.log('\n5. Menu Items SQL Filtering & Search');
    const menuSearch = await makeRequest('GET', '/api/menu?search=burger', null, adminToken);
    assert(menuSearch.status === 200, 'Menu search query returned HTTP 200');
    assert(menuSearch.body.items.length > 0, 'Found burger in menu items');

    // Test 7: Reservation Creation & Conflict Detection
    console.log('\n6. Reservation Conflict Detection');
    const randomDays = 2 + Math.floor(Math.random() * 300);
    const reservationDate = new Date(Date.now() + randomDays * 86400000);
    const reservationTime = reservationDate.toISOString().slice(0, 19).replace('T', ' ');
    const res1 = await makeRequest(
      'POST',
      '/api/reservations',
      {
        table_id: testTable.table_id,
        customer_name: `Test Customer ${Date.now()}`,
        customer_phone: `+92-300-${Math.floor(1000000 + Math.random() * 8999999)}`,
        party_size: 2,
        reservation_time: reservationTime
      },
      adminToken
    );
    assert(res1.status === 201, 'First reservation created successfully (HTTP 201)');

    // Attempt overlapping reservation on the same table within 30 minutes
    const conflictDate = new Date(reservationDate.getTime() + 1800000);
    const conflictTime = conflictDate.toISOString().slice(0, 19).replace('T', ' ');
    const res2 = await makeRequest(
      'POST',
      '/api/reservations',
      {
        table_id: testTable.table_id,
        customer_name: 'Test Customer 2',
        customer_phone: '+92-300-9999902',
        party_size: 2,
        reservation_time: conflictTime
      },
      adminToken
    );
    assert(res2.status === 409, 'Conflicting reservation properly rejected with HTTP 409 Conflict');

    // Test 8: Order Placement (ACID Transaction)
    console.log('\n7. Order Creation with Items (Transaction)');
    const menuItems = menuSearch.body.items;
    const orderRes = await makeRequest(
      'POST',
      '/api/orders',
      {
        table_id: testTable.table_id,
        customer_name: 'Dine In Guest',
        customer_phone: '+92-300-8888801',
        order_type: 'dine_in',
        items: [
          { item_id: menuItems[0].item_id, quantity: 2, special_instructions: 'Extra crispy' }
        ]
      },
      waiterToken
    );
    assert(orderRes.status === 201, 'Order created successfully with HTTP 201');
    const orderId = orderRes.body.data.order_id;
    assert(orderRes.body.data.order_status === 'placed', "Initial order status is 'placed'");
    assert(orderRes.body.data.final_amount > 0, `Order total accurately computed on backend ($${orderRes.body.data.final_amount})`);

    // Verify table status transitioned to occupied
    const tableOccupiedCheck = await makeRequest('GET', `/api/tables/${testTable.table_id}`, null, waiterToken);
    assert(tableOccupiedCheck.body.data.status === 'occupied', "Table status synchronized to 'occupied'");

    // Test 9: Status Transition Lifecycle
    console.log('\n8. Order Status Lifecycle Validation');
    const prepRes = await makeRequest('PATCH', `/api/orders/${orderId}/status`, { status: 'preparing' }, waiterToken);
    assert(prepRes.status === 200 && prepRes.body.data?.order_status === 'preparing', `Transition to 'preparing' succeeded (got: ${prepRes.body.data?.order_status})`);

    const servedRes = await makeRequest('PATCH', `/api/orders/${orderId}/status`, { status: 'served' }, waiterToken);
    assert(servedRes.status === 200 && servedRes.body.data?.order_status === 'served', `Transition to 'served' succeeded (got: ${servedRes.body.data?.order_status})`);

    // Invalid transition attempt: served directly to placed (not allowed)
    const invalidRes = await makeRequest('PATCH', `/api/orders/${orderId}/status`, { status: 'placed' }, waiterToken);
    assert(invalidRes.status === 400, "Illegal status transition 'served' -> 'placed' rejected with HTTP 400");

    // Test 10: Payment Settlement & Table Release
    console.log('\n9. Payment Settlement & Relational Table Release');
    const paymentRes = await makeRequest(
      'POST',
      '/api/payments',
      {
        order_id: orderId,
        payment_method: 'card',
        transaction_reference: 'TXN-TEST-12345'
      },
      waiterToken
    );
    assert(paymentRes.status === 201, 'Payment settled successfully with HTTP 201');

    // Duplicate payment attempt
    const dupPaymentRes = await makeRequest(
      'POST',
      '/api/payments',
      {
        order_id: orderId,
        payment_method: 'cash'
      },
      waiterToken
    );
    assert(dupPaymentRes.status === 409, 'Duplicate payment attempt rejected with HTTP 409');

    // Verify order status is billed
    const orderFinal = await makeRequest('GET', `/api/orders/${orderId}`, null, waiterToken);
    assert(orderFinal.body.data.order_status === 'billed', "Order status successfully set to 'billed'");

    // Verify table is released back to available
    const tableReleased = await makeRequest('GET', `/api/tables/${testTable.table_id}`, null, waiterToken);
    assert(tableReleased.body.data.status === 'available', "Table status successfully released back to 'available'");

    // Test 11: Real Reports & Dashboard Metrics
    console.log('\n10. Dashboard Analytics Aggregations');
    const dashboardRes = await makeRequest('GET', '/api/reports/dashboard', null, adminToken);
    assert(dashboardRes.status === 200, 'Dashboard summary query returns HTTP 200');
    assert(dashboardRes.body.data.metrics.total_revenue_all_time > 0, 'Dashboard reflects actual database revenue');
    assert(dashboardRes.body.data.tables.total_tables > 0, 'Dashboard reflects live table counts');
  } catch (err) {
    console.error('Unhandled test runner error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
