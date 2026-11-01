const paymentsRepository = require('../repositories/paymentsRepository');

const paymentsController = {
  async getAll(req, res, next) {
    try {
      const { method, status, startDate, endDate, page, limit } = req.query;
      const result = await paymentsRepository.findAll({
        method,
        status,
        startDate,
        endDate,
        page,
        limit
      });
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  async getByOrderId(req, res, next) {
    try {
      const payment = await paymentsRepository.findByOrderId(req.params.orderId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'No payment record found for this order.'
        });
      }
      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  },

  async processPayment(req, res, next) {
    try {
      const {
        order_id,
        amount_paid,
        payment_method = 'cash',
        transaction_reference,
        notes
      } = req.body;

      if (!order_id) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'order_id is required.'
        });
      }

      const payment = await paymentsRepository.processPayment({
        order_id: parseInt(order_id, 10),
        amount_paid,
        payment_method,
        transaction_reference,
        received_by_staff_id: req.user.staff_id,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Payment settled and table released.',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = paymentsController;
