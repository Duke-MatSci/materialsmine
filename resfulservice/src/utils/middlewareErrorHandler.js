const { validationResult } = require('express-validator');

exports.validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(403).json({ success: false, message: 'validation error', data: errors.array() });
  return next();
};
