const util = require('util');
const XlsxFileManager = require('../utils/xlsxFileManager');
const BaseSchemaObject = require('../../config/xlsx.json');
const XlsxObject = require('../models/curatedObject');
const { errorWriter } = require('../utils/logWriter');
const XlsxCurationList = require('../models/xlsxCurationList');

exports.curateXlsxSpreadsheet = async (req, res, next) => {
  req.logger.info('curateXlsxSpreadsheet Function Entry:');
  const { user } = req;
  if (!req.files?.uploadfile) {
    return next(errorWriter(req, 'Material template files not uploaded', 'curateXlsxSpreadsheet', 400));
  }

  const regex = /master_template.xlsx$/gi;
  const xlsxFile = req.files.uploadfile.find((file) => regex.test(file?.path));

  if (!xlsxFile) {
    return next(errorWriter(req, 'Master template xlsx file not uploaded', 'curateXlsxSpreadsheet', 400));
  }

  try {
    const [validList, storedObjects] = await Promise.all([
      XlsxCurationList.find({}, null, { lean: true }),
      XlsxObject.find({ user: user._id }, { object: 1 }, { lean: true })
    ]);

    const validListMap = generateCurationListMap(validList);

    const result = await this.createMaterialObject(xlsxFile.path, BaseSchemaObject, validListMap, req.files.uploadfile);

    if (result?.count) return res.status(400).json({ errors: result.errors });

    const curatedAlready = storedObjects.find(
      object => object?.['data origin']?.Title === result?.['data origin']?.Title &&
      object?.['data origin']?.['Publication Type'] === result?.['data origin']?.['Publication Type']);

    if (curatedAlready) return next(errorWriter(req, 'Object already curated', 'curateXlsxSpreadsheet', 409));

    const xlsxObj = new XlsxObject({ object: result, user: user?._id });
    await (await xlsxObj.save()).populate({ path: 'user', select: 'givenName surName' });

    return res.status(201).json(xlsxObj);
  } catch (err) {
    next(errorWriter(req, err, 'curateXlsxSpreadsheet', 500));
  }
};

exports.getXlsxCurations = async (req, res, next) => {
  req.logger.info('getXlsxObject Function Entry:');
  const { user } = req;
  const { xlsxObjectId } = req.query;
  const filter = {};

  if (user?.roles !== 'admin') filter.user = user._id;

  try {
    if (xlsxObjectId) {
      const xlsxObject = await XlsxObject.findOne({ _id: xlsxObjectId, ...filter }, null, { lean: true, populate: { path: 'user', select: 'givenName surName' } });

      if (!xlsxObject) return next(errorWriter(req, 'Xlsx Object not found', 'getXlsxObject', 404));

      const baseUserObject = createBaseObject(BaseSchemaObject, xlsxObject.object);
      return res.status(200).json({ ...xlsxObject, object: baseUserObject });
    } else {
      const xlsxObjects = await XlsxObject.find(filter, { user: 1, createdAt: 1, updatedAt: 1, _v: 1 }, { lean: true, populate: { path: 'user', select: 'givenName surName' } });
      return res.status(200).json(xlsxObjects);
    }
  } catch (err) {
    next(errorWriter(req, err, 'getXlsxObject', 500));
  }
};

exports.updateXlsxCurations = async (req, res, next) => {
  req.logger.info('updateXlsxObject Function Entry:');
  const { user, body: { payload } } = req;
  try {
    const { xlsxObjectId } = req.params;
    const storedObject = await XlsxObject.findOne({ _id: xlsxObjectId }, null, { lean: true, populate: { path: 'user', select: 'givenName surName' } });

    if (!storedObject) return next(errorWriter(req, 'Xlsx Object not found', 'getXlsxObject', 404));

    const baseUserObject = createBaseObject(BaseSchemaObject, storedObject.object);
    const isObjChanged = !util.isDeepStrictEqual(baseUserObject, payload);

    if (isObjChanged) {
      const filteredObject = filterNestedObject(payload);
      const updatedObject = await XlsxObject.findOneAndUpdate({ user: user._id }, { $set: { object: filteredObject } }, { new: true, lean: true, populate: { path: 'user', select: 'givenName surName' } });
      return res.status(200).json(updatedObject);
    }

    return res.status(304).json({ message: 'No changes' });
  } catch (err) {
    next(errorWriter(req, err, 'updateXlsxObject', 500));
  }
};

/**
 * @method createMaterialObject
 * @description Function to parse and curate xlsx object
 * @param {String} path - The path to the xlsx spreadsheet to be parsed
 * @param {Object} BaseObject - The json structure which holds all spreadsheet values and cell location
 * @param {Object} validListMap - The map of all valid curation lists
 * @param {Object} uploadedFiles - The list of all uploaded files data
 * @param {Object} errors - Object created to store errors that occur while parsing the spreadsheets
 * @returns {Object} - Newly curated object or errors that occur while  proces
 */
exports.createMaterialObject = async (path, BaseObject, validListMap, uploadedFiles, errors = {}) => {
  const sheetsData = {};
  const filteredObject = {};

  for (const property in BaseObject) {
    const propertyValue = BaseObject[property];

    if (Array.isArray(propertyValue?.values)) {
      const multiples = propertyValue.values;
      const objArr = [];
      for (const prop of multiples) {
        const newObj = await this.createMaterialObject(path, prop, validListMap, uploadedFiles, errors);
        if (Object.keys(newObj).length > 0) {
          objArr.push(newObj);
        }
      }
      if (objArr.length > 0) {
        filteredObject[property] = objArr;
      }
    } else if (Object.getOwnPropertyDescriptor(propertyValue, 'value')) {
      const [sheetName, row, col] = propertyValue.value.replace(/[[\]]/g, '').split(/\||,/);

      if (!Object.getOwnPropertyDescriptor(sheetsData, sheetName)) {
        sheetsData[sheetName] = await XlsxFileManager.xlsxFileReader(path, sheetName);
      }

      // added plus(+) to parse as integer
      const cellValue = sheetsData[sheetName]?.[+row]?.[+col];

      if (cellValue) {
        if (Object.getOwnPropertyDescriptor(propertyValue, 'validList')) {
          const validListKey = propertyValue.validList;
          const validList = validListMap[validListKey];

          if (!validList && cellValue !== null) {
            filteredObject[property] = cellValue;
          } else if (validList?.includes(cellValue)) {
            filteredObject[property] = cellValue;
          } else if (cellValue !== null) {
            errors[validListKey] = 'Invalid value';
          }
        } else if (propertyValue.type === 'File') {
          const regex = new RegExp(`${cellValue}$`, 'gi');
          const file = uploadedFiles?.find((file) => regex.test(file?.path));
          if (file) {
            filteredObject[property] = file.filename;
          } else {
            errors[cellValue] = 'file not uploaded';
          }
        } else {
          if (cellValue !== null) {
            filteredObject[property] = cellValue;
          }
        }
      } else if (cellValue === null && propertyValue?.default) {
        filteredObject[property] = propertyValue.default;
      }
    } else {
      const nestedObj = await this.createMaterialObject(path, propertyValue, validListMap, uploadedFiles, errors);

      if (Object.keys(nestedObj).length > 0) {
        filteredObject[property] = nestedObj;
      }
    }
  }

  if (Object.keys(errors)?.length) return { errors, count: Object.keys(errors)?.length };

  return filteredObject;
};

exports.getCurationSchemaObject = async (req, res, next) => {
  req.logger.info('getCurationSchemaObject Function Entry:');
  const { sheetName } = req.query;

  const result = BaseSchemaObject[sheetName?.toLowerCase()]
    ? BaseSchemaObject[sheetName?.toLowerCase()]
    : BaseSchemaObject;

  return res.status(200).json(result);
};

/**
 * @description Function to convert valid curation list to object mapping
 * @param {Object} validCurationList - The valid array/List of valid validCurationList
 * @returns {Object} - A valid list object
 */
const generateCurationListMap = (validCurationList) => {
  const validListObject = {};

  for (const validList of validCurationList) {
    validListObject[validList.field] = validList.values;
  }
  return validListObject;
};

/**
 * @description Function to filter out all null/undefined values in the object
 * @param {Object} curatedBaseObject - The curated base object which contains all fields based on the BaseSchemaObject
 * @returns {Object} The filtered curated base object stripped off all null values
 */
function filterNestedObject (curatedBaseObject) {
  const filteredObject = {};
  for (const property in curatedBaseObject) {
    const value = curatedBaseObject[property];
    if (Array.isArray(value)) {
      const objectArray = [];
      for (const property of value) {
        const newObj = filterNestedObject(property);
        if (Object.keys(newObj).length > 0) {
          objectArray.push(newObj);
        }
      }
      if (objectArray.length > 0) {
        filteredObject[property] = objectArray;
      }
    } else if (typeof value === 'object') {
      const nestedObj = filterNestedObject(value);

      if (Object.keys(nestedObj).length > 0) {
        filteredObject[property] = nestedObj;
      }
    } else if (value !== null) {
      filteredObject[property] = value;
    }
  }
  return filteredObject;
}

/**
 * @description Function to create schema object using the BaseObject
 * @param {Object} BaseObject - The json structure which holds all spreadsheet values and cell location
 * @param {Object} storedObject - The stored object retrieved from the database
 * @returns {Object} - Newly curated base object
 */
const createBaseObject = (BaseObject, storedObject) => {
  const curatedBaseObject = {};
  for (const property in BaseObject) {
    const propertyValue = BaseObject[property];
    if (Array.isArray(propertyValue?.values)) {
      const objectArray = propertyValue.values.map((BaseObject, i) => createBaseObject(BaseObject, storedObject?.[property]?.[i]));
      curatedBaseObject[property] = objectArray;
    } else if (propertyValue?.value) {
      if (storedObject?.[property]) {
        curatedBaseObject[property] = storedObject[property];
      } else {
        curatedBaseObject[property] = null;
      }
    } else {
      const nestedObj = createBaseObject(propertyValue, storedObject?.[property]);

      if (Object.keys(nestedObj).length > 0) {
        curatedBaseObject[property] = nestedObj;
      }
    }
  }
  return curatedBaseObject;
};
