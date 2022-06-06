const { param } = require('express-validator');
const { validationErrorHandler } = require('../utils/middlewareErrorHandler');

exports.validateImageMigration = [
  param('imageType').not().isEmpty().withMessage('image type required').bail().isIn(['tiff', 'tif']).withMessage('only supports tiff & tif migration'),
  validationErrorHandler
];

exports.validateImageId = [param('imageId').not().isEmpty().withMessage('image ID required').bail().isMongoId().withMessage('invalid image id'), validationErrorHandler];
