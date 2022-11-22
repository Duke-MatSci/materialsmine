const mongoose = require('mongoose');
const { errorWriter, successWriter } = require('../utils/logWriter');

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
    return res.status(200).json({ images: files });
  } catch (error) {
    next(errorWriter(req, 'error with fetching image', 'imageMigration', 500));
  }
};

exports.fileContent = async (req, res, next) => {
  const { fileId } = req.params;

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'fs'
  });

  try {
    const _id = new mongoose.Types.ObjectId(fileId);
    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.pipe(res);
  } catch (error) {
    next(errorWriter(req, 'error with fetching image', 'fileContent', 500));
  }
};

exports.uploadFile = async (req, res, next) => {
  try {
    req.logger.info('datasetIdUpload Function Entry:');

    successWriter(req, { message: 'success' }, 'uploadFile');
    return res.status(201).json({ files: req.files.uploadfile });
  } catch (error) {
    next(errorWriter(req, 'error uploading files', 'uploadFile', 500));
  }
};
