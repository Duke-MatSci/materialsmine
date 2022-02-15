const path = require('path');
const express = require('express');
const multer = require('multer');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'mm_fils');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const fileMgr = multer({ storage: fileStorage, fileFilter: fileFilter }).fields([{ name: 'uploadfile', maxCount: 20 }]);

const fileServer = express.static(path.join(__dirname, 'mm_files'));

module.exports = {
  fileMgr,
  fileServer
};
