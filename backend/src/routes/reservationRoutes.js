const express = require('express');
const router = express.Router();
const reservationsController = require('../controllers/reservationsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', reservationsController.getAll);
router.get('/:id', reservationsController.getById);
router.post('/', reservationsController.create);
router.put('/:id', reservationsController.update);
router.patch('/:id/status', reservationsController.updateStatus);

module.exports = router;
