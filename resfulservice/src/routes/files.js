const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const isAuth = require('../middlewares/isAuth');
const { validateImageType } = require('../middlewares/validations');
// TODO: Bring back validation and expand
// const { validateImageType, validateImageId } = require('../middlewares/validations');

router.route('/:fileId')
  .get(fileController.fileContent)
  .delete(isAuth, fileController.deleteFile);
router.route('/image_migration/:imageType').get(validateImageType, fileController.imageMigration);
router.route('/upload').post(fileController.uploadFile);

module.exports = router;
