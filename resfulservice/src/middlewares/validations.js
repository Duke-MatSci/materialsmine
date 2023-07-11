const { param, validationResult, body, query, check } = require('express-validator');
const { Types: { ObjectId } } = require('mongoose');
const { userRoles } = require('../../config/constant');
const { errorWriter } = require('../utils/logWriter');
const { SupportedFileTypes } = require('../../config/constant');

exports.validateImageType = [
  param('imageType').not().isEmpty().withMessage('image type required').bail().isIn(['tiff', 'tif']).withMessage('only supports tiff & tif migration'),
  validationErrorHandler
];

exports.validateAcceptableUploadType = [
  param('imageType').not().isEmpty().withMessage('image type required').bail().isIn(['tiff', 'tif', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']).withMessage('only supports tiff, tif, xls, xlsx, jpg, jpeg, & png migration'),
  validationErrorHandler
];

exports.validateFileDownload = [
  query('isDirectory', 'only boolean value allowed').exists().isIn(['true', 'false']),
  check('fileId').custom((value, { req }) => {
    if (req.query.isDirectory === 'true') {
      const filetype = value.split('.').pop();
      if (!SupportedFileTypes.includes(filetype)) {
        throw new Error('Unsupported filetype');
      }
      return true;
    } else if (req.query.isDirectory === 'false') {
      if (ObjectId.isValid(value)) {
        if ((String)(new ObjectId(value)) === value) { return true; }
        throw new Error('Invalid file id');
      }
      throw new Error('Invalid file id');
    }
    return true;
  }),
  validationErrorHandler
];

exports.validateFileId = [
  check('fileId').custom((value, { req }) => {
    const filetype = value.split('.').pop();
    if (!SupportedFileTypes.includes(filetype)) {
      throw new Error('Unsupported filetype');
    }
    return true;
  }),
  validationErrorHandler
];

exports.validateXlsxObjectUpdate = [
  query('xlsxObjectId').not().isEmpty().withMessage('xlsx object ID required').bail().isMongoId().withMessage('invalid xlsx object id'),
  body('payload').isObject().withMessage('please provide xlsx object for update'),
  validationErrorHandler
];

function validationErrorHandler (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'validation error', data: errors.array() });
  return next();
};

exports.validateIsAdmin = (req, res, next) => !req.user?.roles === userRoles.isAdmin && next(errorWriter(req, 'User is forbidden', 'validateIsAdmin', 403));

exports.validateXlsxObjectDelete = [
  query('xlsxObjectId').if(query('dataset').not().exists()).bail().isMongoId().withMessage('invalid xlsx object id'),
  query('dataset').if(query('xlsxObjectId').not().exists()).bail().isMongoId().withMessage('invalid dataset id'),
  validationErrorHandler
];

exports.validateXlsxObjectGet = [
  query('xlsxObjectId').optional().isMongoId().withMessage('invalid xlsx object id'),
  query('xmlId').optional().isMongoId().withMessage('invalid dataset id'),
  validationErrorHandler
];
