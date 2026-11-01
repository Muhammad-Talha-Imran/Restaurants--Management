const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', paymentsController.getAll);
router.get('/order/:orderId', paymentsController.getByOrderId);
router.post('/', paymentsController.processPayment);

module.exports = router;
