const multer = require('multer');
const { uniqueNamesGenerator, adjectives, names, animals } = require('unique-names-generator');
const minioClient = require('../utils/minio');
const { deleteFile } = require('../utils/fileManager');
const { MinioBucket } = require('../../config/constant');

const shortName = uniqueNamesGenerator({
  dictionaries: [adjectives, animals, names],
  length: 3,
  style: 'lowerCase'
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, req.env?.FILES_DIRECTORY ?? 'mm_files');
  },
  filename: (req, file, cb) => {
    cb(null, shortName + '-' + new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/tif' ||
    file.mimetype === 'image/tiff' ||
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/zip' ||
    file.mimetype === 'application/x-zip-compressed'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only .png, .jpg, .jpeg, .tiff, .tif, .csv, .zip, .xls and .xlsx format allowed!'), false);
  }
};

const fileMgr = multer({ storage: fileStorage, fileFilter }).fields([{ name: 'uploadfile', maxCount: 20 }]);

const minioUpload = (req, res, next) => {
  const files = req.files?.uploadfile;
  if (!files) {
    return next();
  }

  files.forEach(file => {
    minioPutObject(file, req);
  });
  next();
};

const minioPutObject = (file, req) => {
  const bucketName = req.env.MINIO_BUCKET ?? MinioBucket;
  const metaData = {
    'Content-Type': file.mimetype,
    'X-Amz-Meta-Testing': '1234'
  };
  minioClient.fPutObject(bucketName, file.filename, file.path, metaData, (err, objInfo) => {
    if (err) {
      console.log(err);
    }

    deleteFile(file.path, req);
  });
};

module.exports = {
  fileMgr,
  minioUpload,
  minioPutObject
};
