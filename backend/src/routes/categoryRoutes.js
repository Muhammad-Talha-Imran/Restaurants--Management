const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', categoriesController.getAll);
router.get('/:id', categoriesController.getById);
router.post('/', requireRoles('admin', 'manager'), categoriesController.create);
router.put('/:id', requireRoles('admin', 'manager'), categoriesController.update);
router.delete('/:id', requireRoles('admin'), categoriesController.delete);

module.exports = router;
