const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const isAuth = require('../middlewares/isAuth');
const { latencyTimer } = require('../middlewares/latencyTimer');
const { minioUpload } = require('../middlewares/fileStorage');
const { validateImageType, validateFileId, validateFileDownload } = require('../middlewares/validations');

router.route('/:fileId([^/]*)')
  .get(validateFileDownload, latencyTimer, fileController.fileContent)
  .delete(isAuth, validateFileId, latencyTimer, fileController.deleteFile);
router.route('/image_migration/:imageType').get(validateImageType, latencyTimer, fileController.imageMigration);
router.route('/upload').post(latencyTimer, minioUpload, fileController.uploadFile);

module.exports = router;
