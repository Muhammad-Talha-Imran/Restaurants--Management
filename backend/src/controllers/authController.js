const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const staffRepository = require('../repositories/staffRepository');
const { JWT_SECRET } = require('../middleware/auth');

const authController = {
  /**
   * Login with username and password
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Both username and password are required.'
        });
      }

      const account = await staffRepository.findAccountByUsername(username);

      if (!account) {
        return res.status(401).json({
          success: false,
          error: 'Authentication Failed',
          message: 'Invalid username or password.'
        });
      }

      if (!account.account_active || !account.staff_active) {
        return res.status(403).json({
          success: false,
          error: 'Account Inactive',
          message: 'This staff account has been deactivated. Please contact an administrator.'
        });
      }

      const isMatch = await bcrypt.compare(password, account.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Authentication Failed',
          message: 'Invalid username or password.'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        {
          account_id: account.account_id,
          staff_id: account.staff_id,
          username: account.username,
          role: account.role
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Record last login
      await staffRepository.updateLastLogin(account.account_id);

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          token,
          user: {
            account_id: account.account_id,
            staff_id: account.staff_id,
            username: account.username,
            full_name: account.full_name,
            email: account.email,
            role: account.role
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get authenticated user profile
   */
  async getCurrentUser(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Change password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Current and new password are required.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'New password must be at least 6 characters long.'
        });
      }

      const account = await staffRepository.findAccountByUsername(req.user.username);
      const isMatch = await bcrypt.compare(currentPassword, account.password_hash);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: 'Authentication Error',
          message: 'Incorrect current password.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);

      await staffRepository.updateAccount(req.user.account_id, { password_hash: newHash });

      res.json({
        success: true,
        message: 'Password changed successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
