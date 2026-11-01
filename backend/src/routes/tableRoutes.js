const express = require('express');
const router = express.Router();
const tablesController = require('../controllers/tablesController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', tablesController.getAll);
router.get('/:id', tablesController.getById);
router.post('/', requireRoles('admin', 'manager'), tablesController.create);
router.put('/:id', requireRoles('admin', 'manager'), tablesController.update);
router.patch('/:id/status', tablesController.updateStatus);
router.delete('/:id', requireRoles('admin'), tablesController.delete);

module.exports = router;
