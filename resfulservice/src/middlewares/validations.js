const {
  param,
  validationResult,
  body,
  query,
  check
} = require('express-validator');
const {
  Types: { ObjectId }
} = require('mongoose');
const { userRoles } = require('../../config/constant');
const { errorWriter } = require('../utils/logWriter');
const { SupportedFileTypes } = require('../../config/constant');

exports.validateImageType = [
  param('imageType')
    .not()
    .isEmpty()
    .withMessage('image type required')
    .bail()
    .isIn(['tiff', 'tif'])
    .withMessage('only supports tiff & tif migration'),
  validationErrorHandler
];

exports.validateAcceptableUploadType = [
  param('imageType')
    .not()
    .isEmpty()
    .withMessage('image type required')
    .bail()
    .isIn(['tiff', 'tif', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'])
    .withMessage(
      'only supports tiff, tif, xls, xlsx, jpg, jpeg, & png migration'
    ),
  validationErrorHandler
];

exports.validateFileDownload = [
  query('isFileStore', 'only boolean value allowed')
    .optional()
    .isIn(['true', 'false']),
  query('isStore', 'only boolean value allowed')
    .optional()
    .isIn(['true', 'false']),
  check('fileId').custom((value, { req }) => {
    if (req.query?.isFileStore === 'true' || req.query?.isStore === 'true') {
      const filetype = value.split('.').pop();
      if (!SupportedFileTypes.includes(filetype)) {
        throw new Error('Unsupported filetype');
      }
      return true;
    } else if (!req.query.isFileStore && !req.query.isStore) {
      if (ObjectId.isValid(value)) {
        if (String(new ObjectId(value)) === value) {
          return true;
        }
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
  query('xlsxObjectId')
    .not()
    .isEmpty()
    .withMessage('xlsx object ID required')
    .bail()
    .isMongoId()
    .withMessage('invalid xlsx object id'),
  body('payload')
    .isObject()
    .withMessage('please provide xlsx object for update'),
  validationErrorHandler
];

function validationErrorHandler (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.logger.info(
      `Middleware.validationErrorHandler = () => ${errors.array()}`
    );
    return res.status(400).json({
      success: false,
      message: 'validation error',
      data: errors.array()
    });
  }
  return next();
}

exports.validateIsAdmin = (req, res, next) =>
  !req.user?.roles === userRoles.isAdmin &&
  next(errorWriter(req, 'User is forbidden', 'validateIsAdmin', 403));

exports.validateXlsxObjectDelete = [
  query('xlsxObjectId')
    .if(query('dataset').not().exists())
    .bail()
    .isMongoId()
    .withMessage('invalid xlsx object id'),
  query('dataset')
    .if(query('xlsxObjectId').not().exists())
    .bail()
    .isMongoId()
    .withMessage('invalid dataset id'),
  validationErrorHandler
];

exports.validateXlsxObjectGet = [
  param('curationId')
    .optional()
    .isMongoId()
    .withMessage('invalid xlsx object id'),
  validationErrorHandler
];

exports.managedServiceDBCall = [
  param('collectionName')
    .isString()
    .isIn(['polymer', 'filler', 'ukpolymer', 'ukfiller'])
    .withMessage(
      'the collectionName should be one of \'polymers\', \'fillers\', \'ukpolymers\', \'ukfillers\''
    ),
  body('action')
    .isString()
    .isIn(['INSERT', 'READ', 'UPDATE', 'DELETE', 'INSERTMANY', 'SEARCH'])
    .withMessage(
      'the action should be one of \'INSERT\', \'READ\', \'UPDATE\', \'DELETE\', \'INSERTMANY\' or \'SEARCH\''
    ),
  body('payload')
    .optional()
    .isArray()
    .withMessage('the payload should be an array'),
  body('findBy')
    .optional()
    .isObject()
    .withMessage('the findBy should be an object'),
  validationErrorHandler
];

exports.validateFavoriteChart = [
  body('chartId')
    .not()
    .isEmpty()
    .withMessage('chart id required')
    .isString()
    .withMessage('chart id should be string'),
  validationErrorHandler
];

exports.validateCreateChangeLog = [
  body('resourceId')
    .isString()
    .notEmpty()
    .withMessage('resourceId must be a non-empty string'),
  body('change')
    .isArray({ max: 1 })
    .withMessage('change must be a non-empty array of a string')
    .custom((value) => {
      if (!value.every((item) => typeof item === 'string')) {
        throw new Error('change must be an array of a string');
      }
      return true;
    }),
  body('published').isBoolean().withMessage('published must be a boolean'),
  validationErrorHandler
];

exports.validateGetChangeLogs = [
  query('published')
    .optional()
    .customSanitizer((value) =>
      value === 'true' || value === 'false' ? JSON.parse(value) : value
    )
    .isBoolean()
    .withMessage('published must be a boolean value'),
  query('page')
    .optional()
    .customSanitizer((value) => parseInt(value))
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than 0'),
  query('pageSize')
    .optional()
    .customSanitizer((value) => parseInt(value))
    .isInt({ min: 1 })
    .withMessage('pageSize must be an integer greater than 0'),
  validationErrorHandler
];

exports.validateApproveCuration = [
  body('curationId')
    .not()
    .isEmpty()
    .withMessage('curationId is required')
    .bail()
    .isMongoId()
    .withMessage('curationId should be a valid mongodb id'),
  body('isNew')
    .not()
    .isEmpty()
    .withMessage('isNew is required')
    .bail()
    .isBoolean()
    .withMessage('isNew should be a boolean'),
  validationErrorHandler
];
