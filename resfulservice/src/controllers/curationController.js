const util = require('util');
const XlsxFileManager = require('../utils/xlsxFileManager');
const jsonStructure = require('../../config/xlsx.json');
const XlsxObject = require('../models/curatedObject');
const { errorWriter } = require('../utils/logWriter');
const XlsxCurationList = require('../models/xlsxCurationList');

exports.curateXlsxSpreadsheet = async (req, res, next) => {
  req.logger.info('createXlsxObject Function Entry:');
  const { user } = req;
  if (!req.files?.uploadfile) {
    return next(errorWriter(req, 'Material template files not uploaded', 'createXlsxObject', 400));
  }

  const regex = /master_template.xlsx$/gi;
  const xlsxFile = req.files.uploadfile.find((file) => regex.test(file?.path));

  if (!xlsxFile) {
    return next(errorWriter(req, 'Master template xlsx file not uploaded', 'createXlsxObject', 400));
  }

  try {
    const validList = await XlsxCurationList.find({}, null, { lean: true });
    const validListMap = generateCurationListMap(validList);

    const result = await this.createMaterialObject(xlsxFile.path, jsonStructure, validListMap, req.files.uploadfile);

    if (result?.count) return res.status(400).json({ errors: result.errors });

    const xlsxObj = new XlsxObject({ object: result, user: user?._id });
    await (await xlsxObj.save()).populate({ path: 'user', select: 'givenName surName' });

    return res.status(201).json(xlsxObj);
  } catch (err) {
    next(errorWriter(req, err, 'createXlsxObject', 500));
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

      const baseUserObject = createBaseObject(jsonStructure, xlsxObject.object);
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

    const baseUserObject = createBaseObject(jsonStructure, storedObject.object);
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

exports.createMaterialObject = async (path, obj, validListMap, uploadedFiles, errors = {}) => {
  const sheetsData = {};
  const filteredObject = {};

  for (const property in obj) {
    const propertyValue = obj[property];

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

const generateCurationListMap = (curationList) => {
  const obj = {};

  for (const list of curationList) {
    obj[list.field] = list.values;
  }
  return obj;
};

function filterNestedObject (obj) {
  const newObj = {};
  for (const prop in obj) {
    const value = obj[prop];
    if (Array.isArray(value)) {
      const objArr = [];
      for (const prop of value) {
        const newObj = filterNestedObject(prop);
        if (Object.keys(newObj).length > 0) {
          objArr.push(newObj);
        }
      }
      if (objArr.length > 0) {
        newObj[prop] = objArr;
      }
    } else if (typeof value === 'object') {
      const nestedObj = filterNestedObject(value);

      if (Object.keys(nestedObj).length > 0) {
        newObj[prop] = nestedObj;
      }
    } else if (value !== null) {
      newObj[prop] = value;
    }
  }
  return newObj;
}

const createBaseObject = (obj, savedObj) => {
  const newObj = {};
  for (const prop in obj) {
    const propVal = obj[prop];
    if (Array.isArray(propVal?.values)) {
      const objArr = propVal.values.map((obj, i) => createBaseObject(obj, savedObj?.[prop]?.[i]));
      newObj[prop] = objArr;
    } else if (propVal?.value) {
      if (savedObj?.[prop]) {
        newObj[prop] = savedObj[prop];
      } else {
        newObj[prop] = null;
      }
    } else {
      const nestedObj = createBaseObject(propVal, savedObj?.[prop]);

      if (Object.keys(nestedObj).length > 0) {
        newObj[prop] = nestedObj;
      }
    }
  }
  return newObj;
};
