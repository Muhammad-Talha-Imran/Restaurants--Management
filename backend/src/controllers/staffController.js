const bcrypt = require('bcryptjs');
const staffRepository = require('../repositories/staffRepository');

const staffController = {
  async getAll(req, res, next) {
    try {
      const { role, is_active, search } = req.query;
      const staffList = await staffRepository.findAll({ role, is_active, search });
      res.json({
        success: true,
        data: staffList
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const member = await staffRepository.findById(req.params.id);
      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Staff member not found.'
        });
      }
      res.json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { full_name, role = 'waiter', phone, email, username, password } = req.body;

      if (!full_name || !phone || !email) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'full_name, phone, and email are required.'
        });
      }

      const newStaff = await staffRepository.createStaff({
        full_name,
        role,
        phone,
        email
      });

      // If username and password provided, create login account
      if (username && password) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        await staffRepository.createAccount({
          staff_id: newStaff.staff_id,
          username,
          password_hash: hash,
          role
        });
      }

      const fullRecord = await staffRepository.findById(newStaff.staff_id);

      res.status(201).json({
        success: true,
        message: 'Staff member registered successfully.',
        data: fullRecord
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { full_name, role, phone, email, is_active } = req.body;
      const updated = await staffRepository.updateStaff(req.params.id, {
        full_name,
        role,
        phone,
        email,
        is_active
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Staff member not found.'
        });
      }

      res.json({
        success: true,
        message: 'Staff member updated successfully.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  async deactivate(req, res, next) {
    try {
      // Prevent deactivating own account
      if (parseInt(req.params.id, 10) === req.user.staff_id) {
        return res.status(400).json({
          success: false,
          error: 'Forbidden Operation',
          message: 'You cannot deactivate your own active account.'
        });
      }

      const deactivated = await staffRepository.deactivate(req.params.id);
      res.json({
        success: true,
        message: 'Staff member and associated login account deactivated.',
        data: deactivated
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = staffController;
