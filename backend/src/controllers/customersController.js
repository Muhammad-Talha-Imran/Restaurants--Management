const customersRepository = require('../repositories/customersRepository');

const customersController = {
  async getAll(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const result = await customersRepository.findAll({ search, page, limit });
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
      const customer = await customersRepository.findById(req.params.id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Customer not found.'
        });
      }
      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  },

  async findOrCreate(req, res, next) {
    try {
      const { full_name, phone, email, notes } = req.body;

      if (!full_name || !phone) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'full_name and phone are required.'
        });
      }

      const customer = await customersRepository.findOrCreate({
        full_name,
        phone,
        email,
        notes
      });

      res.status(200).json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { full_name, phone, email, notes } = req.body;
      const updated = await customersRepository.update(req.params.id, {
        full_name,
        phone,
        email,
        notes
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Customer not found.'
        });
      }

      res.json({
        success: true,
        message: 'Customer updated successfully.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = customersController;
