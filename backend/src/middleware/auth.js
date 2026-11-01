const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_university_dbms_jwt_token_key_2026';

/**
 * Authenticate incoming JWT token
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access token is required. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists and is active in database
    const users = await query(
      `SELECT sa.account_id, sa.staff_id, sa.username, sa.role, sa.is_active,
              s.full_name, s.email
       FROM staff_accounts sa
       INNER JOIN staff s ON sa.staff_id = s.staff_id
       WHERE sa.account_id = ? AND sa.is_active = TRUE AND s.is_active = TRUE`,
      [decoded.account_id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User account is inactive or no longer exists.'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid or expired token.'
    });
  }
}

/**
 * Require specific role or roles (e.g. 'admin', 'manager')
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}] (Your role: ${req.user.role})`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRoles,
  JWT_SECRET
};
