
const express = require('express');
const router = express.Router();
const pixelatedController = require('../controllers/pixelatedController');
// const isAuth = require('../middlewares/isAuth');

router.route('/').post(pixelatedController.uploadPixelData);
router.route('/edit').post(pixelatedController.updatePixelData);

module.exports = router;
