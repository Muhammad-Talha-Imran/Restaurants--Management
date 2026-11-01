const tablesRepository = require('../repositories/tablesRepository');

const tablesController = {
  async getAll(req, res, next) {
    try {
      const { status, minCapacity, is_active } = req.query;
      const tables = await tablesRepository.findAll({ status, minCapacity, is_active });
      res.json({
        success: true,
        data: tables
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const table = await tablesRepository.findById(req.params.id);
      if (!table) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Table not found.'
        });
      }
      res.json({
        success: true,
        data: table
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { table_number, capacity, status, location_notes } = req.body;

      if (!table_number || !capacity) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'table_number and capacity are required.'
        });
      }

      if (parseInt(capacity, 10) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'capacity must be greater than zero.'
        });
      }

      const newTable = await tablesRepository.create({
        table_number,
        capacity: parseInt(capacity, 10),
        status,
        location_notes
      });

      res.status(201).json({
        success: true,
        message: 'Table created successfully.',
        data: newTable
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { table_number, capacity, status, location_notes, is_active } = req.body;

      if (capacity !== undefined && parseInt(capacity, 10) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'capacity must be greater than zero.'
        });
      }

      const updated = await tablesRepository.update(req.params.id, {
        table_number,
        capacity: capacity !== undefined ? parseInt(capacity, 10) : undefined,
        status,
        location_notes,
        is_active
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Table not found or no changes provided.'
        });
      }

      res.json({
        success: true,
        message: 'Table updated successfully.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const validStatuses = ['available', 'occupied', 'reserved'];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const updated = await tablesRepository.updateStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Table not found.'
        });
      }

      res.json({
        success: true,
        message: `Table status updated to '${status}'.`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await tablesRepository.deleteOrDeactivate(req.params.id);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = tablesController;
