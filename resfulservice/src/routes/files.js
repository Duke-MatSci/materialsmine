const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { validateImageType, validateImageId, validateAcceptableUploadType } = require('../middlewares/validations');

router.route('/:fileId').get(validateImageId, fileController.fileContent);
router.route('/image_migration/:imageType').get(validateImageType, fileController.imageMigration);
<<<<<<< HEAD
router.route('/upload').post(fileController.uploadFile);
=======
router.route('/upload').post(validateAcceptableUploadType, fileController.uploadFile);
>>>>>>> 2e97bd057fd4c9c52ff89cb503352fadecdc64a0

module.exports = router;
