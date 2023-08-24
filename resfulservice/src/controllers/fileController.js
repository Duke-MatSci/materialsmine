const mongoose = require('mongoose');
const { PassThrough } = require('stream');
const fsFiles = require('../models/fsFiles');
const latency = require('../middlewares/latencyTimer');
const { errorWriter, successWriter } = require('../utils/logWriter');
const FileManager = require('../utils/fileManager');
const { SupportedFileResponseHeaders } = require('../../config/constant');
const minioClient = require('../utils/minio');
const { MinioBucket } = require('../../config/constant');

exports._createEmptyStream = () => new PassThrough('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII').end();

exports.imageMigration = async (req, res, next) => {
  const { imageType } = req.params;

  try {
    const bucket = this.connectToMongoBucket();
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
  const { fileId } = req.params;
  try {
    if (req.query.isFileStore) {
      const { fileStream, ext } = await FileManager.findFile(req);

      if (!fileStream) {
        // TODO (@TOLU): Refactor later as this is duplicated below Ln 67, also used in Ln 51
        res.setHeader('Content-Type', 'image/png');
        latency.latencyCalculator(res);
        return this._createEmptyStream().pipe(res);
      }
      latency.latencyCalculator(res);
      res.setHeader('Content-Type', SupportedFileResponseHeaders[ext]);
      return fileStream.pipe(res);
    }

    if (req.query.isStore) {
      const bucketName = req.env.MINIO_BUCKET ?? MinioBucket;
      const dataStream = await minioClient.getObject(bucketName, fileId);

      if (!dataStream) {
        res.setHeader('Content-Type', 'image/png');
        latency.latencyCalculator(res);
        return this._createEmptyStream().pipe(res);
      }

      const { ext } = FileManager.getFileExtension(fileId);
      res.setHeader('Content-Type', SupportedFileResponseHeaders[ext ?? 'image/png']);
      latency.latencyCalculator(res);
      return dataStream.pipe(res);
    }

    const bucket = this.connectToMongoBucket();

    const _id = new mongoose.Types.ObjectId(fileId);
    const exist = await fsFiles.findById(_id).limit(1);
    if (!exist) {
      res.setHeader('Content-Type', 'image/png');
      latency.latencyCalculator(res);
      return this._createEmptyStream().pipe(res);
    }
    const downloadStream = bucket.openDownloadStream(_id);
    latency.latencyCalculator(res);
    downloadStream.pipe(res);
  } catch (error) {
    next(errorWriter(req, `${error.message ?? 'Error fetching file'}`, 'fileContent', 500));
  }
};

exports.uploadFile = async (req, res, next) => {
  try {
    req.logger.info('datasetIdUpload Function Entry:');

    successWriter(req, { message: 'success' }, 'uploadFile');
    latency.latencyCalculator(res);
    const files = req.files.uploadfile.map(({ filename }) => ({
      filename: `/api/files/${filename}?isStore=true`,
      swaggerFilename: filename,
      isStore: true
    }));
    return res.status(201).json({ files });
  } catch (error) {
    next(errorWriter(req, 'Error uploading files', 'uploadFile', 500));
  }
};

exports.deleteFile = async (req, res, next) => {
  const filesDirectory = req.env?.FILES_DIRECTORY;
  const { fileId } = req.params;
  const filePath = `${filesDirectory}/${fileId}`;
  try {
    const bucketName = req.env.MINIO_BUCKET ?? MinioBucket;

    await minioClient.removeObject(bucketName, fileId);
    FileManager.deleteFile(filePath, req);
    latency.latencyCalculator(res);
    return res.sendStatus(200);
  } catch (err) {
    next(errorWriter(req, `${err.message ?? 'Error deleting files'}`, 'deleteFile', 500));
  }
};

exports.findFiles = (req, res) => {
  const bucketName = req.env.MINIO_BUCKET ?? MinioBucket;
  const query = req.query.filename;

  const objectsStream = minioClient.listObjects(bucketName, query, true);
  const foundFiles = [];
  objectsStream.on('data', (obj) => {
    foundFiles.push(obj.name);
  });

  objectsStream.on('end', () => {
    res.json({ files: foundFiles });
  });

  objectsStream.on('error', (err) => {
    req.logger.error(err);
    res.status(500).json({ error: 'Error finding files in Minio' });
  });
};

// TODO (@TOLU): Move to utils folder
exports.connectToMongoBucket = () => {
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'fs'
  });
  return bucket;
};
