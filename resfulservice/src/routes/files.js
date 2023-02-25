const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { validateImageType, validateImageId } = require('../middlewares/validations');

router.route('/:fileId').get(validateImageId, fileController.fileContent);
router.route('/image_migration/:imageType').get(validateImageType, fileController.imageMigration);
router.route('/jobs').get(fileController.jobsDataFiles);

module.exports = router;
