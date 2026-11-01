const reservationsRepository = require('../repositories/reservationsRepository');
const customersRepository = require('../repositories/customersRepository');

const reservationsController = {
  async getAll(req, res, next) {
    try {
      const { date, status, table_id, customer_id, page, limit } = req.query;
      const result = await reservationsRepository.findAll({
        date,
        status,
        table_id,
        customer_id,
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
      const reservation = await reservationsRepository.findById(req.params.id);
      if (!reservation) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Reservation not found.'
        });
      }
      res.json({
        success: true,
        data: reservation
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const {
        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        table_id,
        reservation_time,
        party_size,
        special_requests
      } = req.body;

      if (!table_id || !reservation_time || !party_size) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'table_id, reservation_time, and party_size are required.'
        });
      }

      let resolvedCustomerId = customer_id;

      // If customer info is provided directly without ID, find or create
      if (!resolvedCustomerId && customer_phone && customer_name) {
        const customer = await customersRepository.findOrCreate({
          full_name: customer_name,
          phone: customer_phone,
          email: customer_email
        });
        resolvedCustomerId = customer.customer_id;
      }

      if (!resolvedCustomerId) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Customer information (or existing customer_id) is required.'
        });
      }

      const created = await reservationsRepository.create({
        customer_id: resolvedCustomerId,
        table_id: parseInt(table_id, 10),
        reservation_time,
        party_size: parseInt(party_size, 10),
        special_requests,
        created_by_staff_id: req.user.staff_id
      });

      res.status(201).json({
        success: true,
        message: 'Reservation created successfully.',
        data: created
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await reservationsRepository.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Reservation not found.'
        });
      }
      res.json({
        success: true,
        message: 'Reservation updated successfully.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const updated = await reservationsRepository.updateStatus(req.params.id, status);
      res.json({
        success: true,
        message: `Reservation status changed to '${status}'.`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reservationsController;
