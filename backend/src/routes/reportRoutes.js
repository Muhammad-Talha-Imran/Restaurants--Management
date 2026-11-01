const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireRoles('admin', 'manager'));

router.get('/dashboard', reportsController.getDashboard);
router.get('/sales', reportsController.getSales);
router.get('/top-items', reportsController.getTopItems);
router.get('/category-sales', reportsController.getCategorySales);
router.get('/staff-performance', reportsController.getStaffPerformance);

module.exports = router;
