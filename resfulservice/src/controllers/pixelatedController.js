const csv = require('csvtojson');
const PixelData = require('../models/pixelated');
const deleteFile = require('../utils/fileManager');
const { errorWriter, successWriter } = require('../utils/logWriter');

exports.uploadPixelData = async (req, res, next) => {
  try {
    req.logger.info('pixelData Upload Function Entry:');
    if (!req.user) {
      deleteFile(req.files.uploadfile[0].path, req);
      return next(errorWriter(req, 'Not authenticated', 'uploadPixelData', 401));
    }

    if (!req.files?.uploadfile) {
      return next(errorWriter(req, 'PixelData csv not uploaded', 'uploadPixelData', 400));
    }

    const dataExists = await PixelData.findOne({});
    if (dataExists) {
      deleteFile(req.files.uploadfile[0].path, req);
      return next(errorWriter(req, 'Pixeldata already exists', 'uploadPixelData', 403));
    }

    const pixelDataArray = await csv().fromFile(req.files.uploadfile[0].path);
    if (pixelDataArray.length === 0) {
      deleteFile(req.files.uploadfile[0].path, req);
      return next(errorWriter(req, 'PixelData csv is empty', 'uploadPixelData', 400));
    }
    await insertMany(req, pixelDataArray);
    deleteFile(req.files.uploadfile[0].path, req);
    successWriter(req, { message: 'success' }, 'uploadPixelData');
    return res.status(201).json({ message: 'success' });
  } catch (error) {
    req.logger?.error(`[uploadPixelData]: ${error}`);
    next(error);
  }
};

exports.updatePixelData = async (req, res, next) => {
  try {
    req.logger.info('pixelData Update Function Entry:');
    if (!req.user) {
      req.files.uploadfile.forEach(({ path }) => {
        deleteFile(path, req);
      });
      return next(errorWriter(req, 'Not authenticated', 'updatePixelData', 401));
    }

    if (!req.files?.uploadfile) {
      return next(errorWriter(req, 'PixelData csv not uploaded', 'updatePixelData', 400));
    }
    if (req.body.dataExists) {
      await PixelData.deleteMany({});
      successWriter(req, 'Successfully deleted all existing pixel data in mongoDB', 'updatePixelData');
    }
    req.files.uploadfile.forEach(async ({ path }) => {
      const pixelDataArray = await csv().fromFile(path);
      await insertMany(req, pixelDataArray);
      deleteFile(path, req);
    });
    successWriter(req, { message: 'success' }, 'updatePixelData');
    return res.status(201).json({ message: 'success' });
  } catch (error) {
    req.logger?.error(`[updatePixelData]: ${error}`);
    error.message = 'Internal Server Error';
    next(error);
  }
};

async function insertMany (req, pixelData) {
  try {
    await PixelData.insertMany(pixelData, { ordered: false });
  } catch (e) {
    errorWriter(req, e, 'insertMany');
  }
}
