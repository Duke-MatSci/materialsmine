const mongoose = require('mongoose');
const { PassThrough } = require('stream');
const fsFiles = require('../models/fsFiles');
const latency = require('../middlewares/latencyTimer');
const { errorWriter, successWriter } = require('../utils/logWriter');
const FileManager = require('../utils/fileManager');
const DatasetFileManager = require('../utils/curation-utility');
const {
  SupportedFileResponseHeaders,
  colorAssignment,
  SupportedFileTypes
} = require('../../config/constant');
const minioClient = require('../utils/minio');
const { MinioBucket, MetamineBucket } = require('../../config/constant');
const bucketName = process.env?.MINIO_BUCKET ?? MinioBucket;

exports._createEmptyStream = () =>
  new PassThrough(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII'
  ).end();

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
    if (req.query.isFileStore && req.query.isFileStore === 'true') {
      const { fileStream, ext } = await FileManager.findFile(req);

      if (!fileStream) {
        res.setHeader('Content-Type', 'image/png');
        latency.latencyCalculator(res);
        return this._createEmptyStream().pipe(res);
      }

      if (req.isInternal) return fileStream;
      latency.latencyCalculator(res);
      res.setHeader('Content-Type', SupportedFileResponseHeaders[ext]);
      return fileStream.pipe(res);
    }

    if (req.query.isStore && req.query.isStore === 'true') {
      const dataStream = await minioClient.getObject(bucketName, fileId);
      if (req.isInternal) return dataStream;
      if (!dataStream) {
        res.setHeader('Content-Type', 'image/png');
        latency.latencyCalculator(res);
        return this._createEmptyStream().pipe(res);
      }

      const { ext } = FileManager.getFileExtension(fileId);
      res.setHeader(
        'Content-Type',
        SupportedFileResponseHeaders[ext ?? 'image/png']
      );
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
    next(
      errorWriter(
        req,
        `${error.message ?? 'Error fetching file'}`,
        'fileContent',
        500
      )
    );
  }
};

exports.uploadFile = async (req, res, next) => {
  try {
    req.logger.info('datasetIdUpload Function Entry:');
    successWriter(req, { message: 'success' }, 'uploadFile');
    latency.latencyCalculator(res);

    const storeLocation =
      req.query?.isTemp === 'true' ? 'isFileStore' : 'isStore';
    const files = req.files.uploadfile.map(({ filename }) => ({
      filename: `/api/files/${filename}?${storeLocation}=true`,
      swaggerFilename: filename,
      isStore: storeLocation === 'isStore'
    }));

    return res.status(201).json({ files });
  } catch (error) {
    next(errorWriter(req, 'Error uploading files', 'uploadFile', 500));
  }
};

exports.getMetamineFileNames = async (req, res, next) => {
  const foundFiles = [];
  try {
    const bucketName = MetamineBucket;
    const objectsStream = minioClient.listObjects(bucketName, undefined, true);
    objectsStream.on('data', (obj) => {
      foundFiles.push(obj.name);
    });

    objectsStream.on('end', () => {
      const fetchedNames = foundFiles.map((file, i) => {
        return {
          key: i, // key for table
          bucket_name: bucketName,
          name: file,
          color: colorAssignment[i]
        };
      });
      latency.latencyCalculator(res);
      res.json({ fetchedNames });
    });
  } catch (error) {
    next(
      errorWriter(
        req,
        'error listing metamine objects',
        'getMetamineFileNames',
        500
      )
    );
  }
};

exports.fetchMetamineDatasets = async (req, res, next) => {
  const { fileName } = req.params;
  try {
    const bucketName = MetamineBucket;
    const stream = await minioClient.getObject(bucketName, fileName);
    if (!stream) {
      return next(
        errorWriter(
          req,
          'metamine dataset does not exist',
          'fetchMetamineDatasets',
          404
        )
      );
    }
    // TODO: Remove third argument when metamine csv is fixed
    const data = await DatasetFileManager.parseCSV(null, stream, true);
    successWriter(req, { message: 'success' }, 'fetchDatasets');
    return res.status(200).json({ fetchedData: data });
  } catch (error) {
    next(
      errorWriter(
        req,
        'error fetching metamine csv object',
        'fetchMetamineDatasets',
        500
      )
    );
  }
};

exports.jobsDataFiles = (req, res, next) => {
  // TODO: Serve requested files from mockDB/managedservices folder
  return res.status(200);
};

exports.deleteFile = async (req, res, next) => {
  const filesDirectory = req.env?.FILES_DIRECTORY;
  const { fileId } = req.params;
  const filePath = `${filesDirectory}/${fileId}`;
  try {
    const isStoreFiles = SupportedFileTypes.some((storeFileType) =>
      fileId.includes(storeFileType)
    );
    if (!isStoreFiles) {
      const _id = new mongoose.Types.ObjectId(fileId);
      await fsFiles.findByIdAndDelete(_id);
    } else {
      await minioClient.removeObject(bucketName, fileId);
      FileManager.deleteFile(filePath, req);
    }

    if (req.isInternal) return true;
    latency.latencyCalculator(res);
    return res.sendStatus(200);
  } catch (err) {
    next(
      errorWriter(
        req,
        `${err.message ?? 'Error deleting files'}`,
        'deleteFile',
        500
      )
    );
  }
};

// TODO (@TOLU): Move to utils folder
exports.connectToMongoBucket = () => {
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'fs'
  });
  return bucket;
};
