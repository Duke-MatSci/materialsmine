const csv = require('csvtojson');
const PixelData = require('../models/pixelated');
const deleteFile = require('../utils/fileManager');

exports.uploadPixelData = async (req, res, next) => {
  try {
    req.logger.info('pixelData Upload Function Entry:');
    if (!req.files?.uploadfile) return res.status(400).json({ message: 'PixelData csv not uploaded', statusCode: 400 });
    if (!req.userId) {
      req.logger?.error('[uploadPixelData]: User not authenticated to upload data');
      deleteFile(req.files.uploadfile[0].path, req);
      return res.status(401).json({ message: 'Not authenticated', statusCode: 401 });
    }

    const pixelDataArray = await csv().fromFile(req.files.uploadfile[0].path);
    PixelData.insertMany(pixelDataArray);
    res.status(201).json({ message: 'success', statusCode: 201 });
    return deleteFile(req.files.uploadfile[0].path, req);
  } catch (error) {
    req.logger?.error(`[uploadPixelData]: ${error}`);
    return res.status(500).json({ message: 'Internal server error', statusCode: 500 });
  }
};

exports.updatePixelData = async (req, res, next) => {
  try {
    req.logger.info('pixelData Update Function Entry:');
    if (!req.userId) {
      req.logger?.error('[updatePixelData]: User not authenticated to update data');
      deleteFile(req.files.uploadfile[0].path, req);
      return res.status(401).json({ message: 'Not authenticated', statusCode: 401 });
    }
    const pixelDataArray = await csv().fromFile(req.files.uploadfile[0].path);
    await PixelData.deleteMany({});
    PixelData.insertMany(pixelDataArray);
    res.status(201).json({ message: 'success', statusCode: 201 });
    return deleteFile(req.files.uploadfile[0].path, req);
  } catch (error) {
    req.logger?.error(`[updatePixelData]: ${error}`);
    return res.status(500).json({ message: 'Internal server error', statusCode: 500 });
  }
};
