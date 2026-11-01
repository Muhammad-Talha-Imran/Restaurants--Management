const ordersRepository = require('../repositories/ordersRepository');
const customersRepository = require('../repositories/customersRepository');

const ordersController = {
  async getAll(req, res, next) {
    try {
      const {
        status,
        table_id,
        staff_id,
        order_type,
        startDate,
        endDate,
        search,
        page,
        limit
      } = req.query;

      const result = await ordersRepository.findAll({
        status,
        table_id,
        staff_id,
        order_type,
        startDate,
        endDate,
        search,
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

  async getById(req, res, next) {
    try {
      const order = await ordersRepository.findById(req.params.id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Order not found.'
        });
      }
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const {
        table_id,
        customer_id,
        customer_name,
        customer_phone,
        order_type = 'dine_in',
        notes,
        items,
        tax_rate = 5.0,
        discount_amount = 0.00
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'An order must contain at least one valid menu item.'
        });
      }

      let resolvedCustomerId = customer_id;
      if (!resolvedCustomerId && customer_phone && customer_name) {
        const customer = await customersRepository.findOrCreate({
          full_name: customer_name,
          phone: customer_phone
        });
        resolvedCustomerId = customer.customer_id;
      }

      const newOrderId = await ordersRepository.createWithItems({
        table_id: table_id ? parseInt(table_id, 10) : null,
        staff_id: req.user.staff_id,
        customer_id: resolvedCustomerId,
        order_type,
        notes,
        items,
        tax_rate,
        discount_amount
      });

      const fullOrder = await ordersRepository.findById(newOrderId);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully.',
        data: fullOrder
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'status is required.'
        });
      }

      const updated = await ordersRepository.updateStatus(req.params.id, status);
      res.json({
        success: true,
        message: `Order status transitioned to '${status}'.`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  async addItem(req, res, next) {
    try {
      const { item_id, quantity, special_instructions } = req.body;
      if (!item_id) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'item_id is required.'
        });
      }

      const updated = await ordersRepository.addItem(req.params.id, {
        item_id: parseInt(item_id, 10),
        quantity: quantity || 1,
        special_instructions
      });

      res.json({
        success: true,
        message: 'Item added to order.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  async removeItem(req, res, next) {
    try {
      const updated = await ordersRepository.removeItem(req.params.id, req.params.itemId);
      res.json({
        success: true,
        message: 'Item removed from order.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ordersController;
