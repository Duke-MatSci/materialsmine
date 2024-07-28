const multer = require('multer');
const {
  uniqueNamesGenerator,
  adjectives,
  names,
  animals
} = require('unique-names-generator');
const minioClient = require('../utils/minio');
const { deleteFile } = require('../utils/fileManager');
const { MinioBucket, MetamineBucket } = require('../../config/constant');

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
    cb(
      null,
      shortName + '-' + new Date().toISOString() + '-' + file.originalname
    );
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
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/zip' ||
    file.mimetype === 'application/x-zip-compressed' ||
    file.mimetype === 'application/octet-stream' ||
    file.mimetype === 'text/tab-separated-values' ||
    file.mimetype === 'text/plain' ||
    file.mimetype === 'text/xml' ||
    file.mimetype === 'application/xml'
  ) {
    cb(null, true);
  } else {
    req.logger.error(
      `fileFilter () => Files with ${file.mimetype} mimetype not acceptable`
    );
    cb(
      new Error(
        'Only .png, .jpg, .jpeg, .tiff, .tif, .csv, .zip, .xls, .xml and .xlsx format allowed!'
      ),
      false
    );
  }
};

const fileMgr = multer({ storage: fileStorage, fileFilter }).fields([
  { name: 'uploadfile', maxCount: 20 }
]);

const minioUpload = (req, res, next) => {
  // Boolean flag which determines whether to upload to the object store.
  if (req.query?.isTemp) return next();

  const files = req.files?.uploadfile;
  if (!files) {
    return next();
  }

  files.forEach((file) => {
    minioPutObject(file, req);
  });
  next();
};

const minioPutObject = (file, req) => {
  const bucketName =
    req.query?.isVisualizationCSV === 'true'
      ? process.env?.METAMINEBUCKET ?? MetamineBucket
      : process.env?.MINIO_BUCKET ?? MinioBucket;

  const metaData = {
    'Content-Type': file.mimetype,
    'X-Amz-Meta-Data': 'MaterialsMine Project'
  };

  minioClient.fPutObject(
    bucketName,
    file.filename,
    file.path,
    metaData,
    (err, objInfo) => {
      if (err) {
        console.log(err);
      }

      deleteFile(file.path, req);
    }
  );
};

module.exports = {
  fileMgr,
  minioUpload,
  minioPutObject
};
