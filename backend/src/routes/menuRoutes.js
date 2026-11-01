const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', menuController.getAll);
router.get('/:id', menuController.getById);
router.post('/', requireRoles('admin', 'manager'), menuController.create);
router.put('/:id', requireRoles('admin', 'manager'), menuController.update);
router.patch('/:id/toggle', menuController.toggleAvailability);
router.delete('/:id', requireRoles('admin'), menuController.delete);

module.exports = router;
