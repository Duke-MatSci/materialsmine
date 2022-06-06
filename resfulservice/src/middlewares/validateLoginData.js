const { check } = require('express-validator');
const { validationErrorHandler } = require('../utils/middlewareErrorHandler');

exports.validateLogin = [
  check('userId').not().isEmpty().withMessage('userId required').bail().isMongoId().withMessage('invalid userId'),
  check('password').not().isEmpty().withMessage('password required').bail().isString().withMessage('invalid password'),
  validationErrorHandler
];
