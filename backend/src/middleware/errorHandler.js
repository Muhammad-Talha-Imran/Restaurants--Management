/**
 * Centralized API Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error(`[API Error] ${req.method} ${req.url} -`, err);

  // MySQL specific constraint violations
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'A record with this unique identifier already exists.',
      details: err.sqlMessage || err.message
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      success: false,
      error: 'Foreign Key Constraint Violation',
      message: 'Cannot perform operation because related referenced records exist or are missing.',
      details: err.sqlMessage || err.message
    });
  }

  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return res.status(400).json({
      success: false,
      error: 'Database Check Constraint Violated',
      message: 'The submitted values violated validation bounds (e.g. negative price or zero capacity).',
      details: err.sqlMessage || err.message
    });
  }

  // Custom application errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

/**
 * 404 Route Not Found handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API endpoint ${req.method} ${req.originalUrl} does not exist.`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
