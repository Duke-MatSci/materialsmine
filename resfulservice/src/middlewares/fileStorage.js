const path = require('path');
const express = require('express');
const multer = require('multer');
const { uniqueNamesGenerator, adjectives, names, animals } = require('unique-names-generator');

const shortName = uniqueNamesGenerator({
  dictionaries: [adjectives, animals, names],
  length: 3,
  style: 'lowerCase'
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'mm_fils');
  },
  filename: (req, file, cb) => {
    cb(null, shortName + '-' + new Date().toISOString() + '-' + file.originalname);
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

const fileMgr = multer({ storage: fileStorage, fileFilter }).fields([{ name: 'uploadfile', maxCount: 20 }]);

const fileServer = express.static(path.join(__dirname, 'filestore'));

module.exports = {
  fileMgr,
  fileServer
};
