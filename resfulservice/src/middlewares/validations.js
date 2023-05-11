const { param, validationResult, body } = require('express-validator');

exports.validateImageType = [
  param('imageType').not().isEmpty().withMessage('image type required').bail().isIn(['tiff', 'tif']).withMessage('only supports tiff & tif migration'),
  validationErrorHandler
];

exports.validateAcceptableUploadType = [
  param('imageType').not().isEmpty().withMessage('image type required').bail().isIn(['tiff', 'tif', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']).withMessage('only supports tiff, tif, xls, xlsx, jpg, jpeg, & png migration'),
  validationErrorHandler
];

exports.validateXlsxObjectUpdate = [
  param('xlsxObjectId').not().isEmpty().withMessage('xlsx object ID required').bail().isMongoId().withMessage('invalid xlsx object id'),
  body('payload').isObject().withMessage('please provide xlsx object for update'),
  validationErrorHandler
];

exports.validateImageId = [param('fileId').not().isEmpty().withMessage('image ID required').bail().isMongoId().withMessage('invalid file id'), validationErrorHandler];

function validationErrorHandler (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'validation error', data: errors.array() });
  return next();
};

exports.validateIsAdmin = (user) => user?.roles === 'admin';
