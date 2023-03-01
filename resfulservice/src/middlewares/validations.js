const { param, validationResult } = require('express-validator');

exports.validateImageType = [
  param('imageType').not().isEmpty().withMessage('image type required').bail().isIn(['tiff', 'tif']).withMessage('only supports tiff & tif migration'),
  validationErrorHandler
];

exports.validateAcceptableUploadType = [
  param('imageType').not().isEmpty().withMessage('image type required').bail().isIn(['tiff', 'tif', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']).withMessage('only supports tiff, tif, xls, xlsx, jpg, jpeg, & png migration'),
  validationErrorHandler
];

exports.validateImageId = [param('fileId').not().isEmpty().withMessage('image ID required').bail().isMongoId().withMessage('invalid file id'), validationErrorHandler];

function validationErrorHandler (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(403).json({ success: false, message: 'validation error', data: errors.array() });
  return next();
};

exports.validateIsAdmin = (user) => user?.roles === 'admin';
