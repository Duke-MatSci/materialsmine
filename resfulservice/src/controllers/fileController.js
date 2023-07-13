const mongoose = require('mongoose');
const { PassThrough } = require('stream');
const fsFiles = require('../models/fsFiles');
const latency = require('../middlewares/latencyTimer');
const { errorWriter, successWriter } = require('../utils/logWriter');
const { deleteFile, findFile } = require('../utils/fileManager');
const { SupportFileResponseHeaders } = require('../../config/constant');

const _createEmptyStream = () => new PassThrough('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII').end();

exports.imageMigration = async (req, res, next) => {
  const { imageType } = req.params;

  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'fs'
    });

    const files = await bucket
      .find({ filename: { $regex: imageType } })
      .limit(10)
      .toArray();
    successWriter(req, { message: 'success' }, 'imageMigration');
    latency.latencyCalculator(res);
    return res.status(200).json({ images: files });
  } catch (error) {
    next(errorWriter(req, 'Error fetching image', 'imageMigration', 500));
  }
};

exports.fileContent = async (req, res, next) => {
  try {
    if (req.query.isDirectory) {
      const { fileStream, ext } = await findFile(req);

      if (!fileStream) {
        res.setHeader('Content-Type', 'image/png');
        latency.latencyCalculator(res);
        return _createEmptyStream().pipe(res);
      }
      res.setHeader('Content-Type', SupportFileResponseHeaders[ext]);
      latency.latencyCalculator(res);
      return fileStream.pipe(res);
    }

    const { fileId } = req.params;
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'fs'
    });

    const _id = new mongoose.Types.ObjectId(fileId);
    const exist = await fsFiles.findById(_id).limit(1);
    if (!exist) {
      res.setHeader('Content-Type', 'image/png');
      latency.latencyCalculator(res);
      return _createEmptyStream().pipe(res);
    }
    const downloadStream = bucket.openDownloadStream(_id);
    latency.latencyCalculator(res);
    downloadStream.pipe(res);
  } catch (error) {
    next(errorWriter(req, 'Error fetching file', 'fileContent', 500));
  }
};

exports.uploadFile = async (req, res, next) => {
  try {
    req.logger.info('datasetIdUpload Function Entry:');

    successWriter(req, { message: 'success' }, 'uploadFile');
    latency.latencyCalculator(res);
    return res.status(201).json({ files: req.files.uploadfile });
  } catch (error) {
    next(errorWriter(req, 'Error uploading files', 'uploadFile', 500));
  }
};

exports.deleteFile = (req, res, next) => {
  const filesDirectory = req.env?.FILES_DIRECTORY;
  const { fileId } = req.params;
  const filePath = `${filesDirectory}/${fileId}`;
  try {
    deleteFile(filePath, req);
    latency.latencyCalculator(res);
    return res.sendStatus(200);
  } catch (err) {
    next(errorWriter(req, 'Error deleting files', 'deleteFile', 500));
  }
};
