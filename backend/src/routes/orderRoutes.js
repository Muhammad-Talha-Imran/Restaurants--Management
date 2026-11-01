const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', ordersController.getAll);
router.get('/:id', ordersController.getById);
router.post('/', ordersController.create);
router.patch('/:id/status', ordersController.updateStatus);
router.post('/:id/items', ordersController.addItem);
router.delete('/:id/items/:itemId', ordersController.removeItem);

module.exports = router;
