const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const isAuth = require('../middlewares/isAuth');
const { latencyTimer } = require('../middlewares/latencyTimer');
const { minioUpload } = require('../middlewares/fileStorage');
const {
  validateImageType,
  validateFileDownload
} = require('../middlewares/validations');

router
  .route('/image_migration/:imageType')
  .get(validateImageType, latencyTimer, fileController.imageMigration);

router
  .route('/upload')
  .post(isAuth, latencyTimer, minioUpload, fileController.uploadFile);

router.route('/metamine').get(fileController.getMetamineFileNames);

router.route('/metamine/:fileName').get(fileController.fetchMetamineDatasets);

router
  .route('/:fileId([^/]*)')
  .get(validateFileDownload, latencyTimer, fileController.fileContent)
  .delete(isAuth, latencyTimer, fileController.deleteFile);

module.exports = router;
