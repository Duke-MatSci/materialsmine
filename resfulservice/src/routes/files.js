const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { validateImageType, validateImageId } = require('../middlewares/validations');

router.route('/:fileId').get(validateImageId, imageController.fileContent);
router.route('/image_migration/:imageType').get(validateImageType, imageController.imageMigration);

module.exports = router;
