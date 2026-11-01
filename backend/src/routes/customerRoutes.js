const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', customersController.getAll);
router.get('/:id', customersController.getById);
router.post('/find-or-create', customersController.findOrCreate);
router.put('/:id', customersController.update);

module.exports = router;
