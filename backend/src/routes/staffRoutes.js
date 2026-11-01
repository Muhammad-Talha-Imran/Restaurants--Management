const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.use(authenticateToken);
// Staff management endpoints require admin or manager privileges
router.use(requireRoles('admin', 'manager'));

router.get('/', staffController.getAll);
router.get('/:id', staffController.getById);
router.post('/', staffController.create);
router.put('/:id', staffController.update);
router.patch('/:id/deactivate', staffController.deactivate);

module.exports = router;
