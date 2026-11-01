require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const menuRoutes = require('./routes/menuRoutes');
const customerRoutes = require('./routes/customerRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const staffRoutes = require('./routes/staffRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoint (Verifies API and Live MySQL Connection)
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  const uptime = process.uptime();

  res.status(dbStatus.connected ? 200 : 503).json({
    status: dbStatus.connected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(uptime),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount API Modules
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server startup if not imported by test runner
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(`  RESTAURANT TABLE & ORDER MANAGEMENT SYSTEM (DBMS API)`);
    console.log(`  Server running on http://localhost:${PORT}`);
    console.log(`=======================================================`);

    const db = await testConnection();
    if (db.connected) {
      console.log(`[Database] Connected successfully to MySQL/MariaDB (${db.version}) on database: '${db.database}'`);
    } else {
      console.error(`[Database ERROR] Failed to connect: ${db.error}`);
    }
  });
}

module.exports = app;
