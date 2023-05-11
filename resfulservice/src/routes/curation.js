const express = require('express');
const router = express.Router();
const xlsxController = require('../controllers/curationController');
const isAuth = require('../middlewares/isAuth');
const { validateXlsxObjectUpdate } = require('../middlewares/validations');

router.route('/new')
  .post(isAuth, xlsxController.curateXlsxSpreadsheet);

router.route('/get')
  .get(isAuth, xlsxController.getXlsxCurations);

router.route('/update/:xlsxObjectId')
  .put(validateXlsxObjectUpdate, isAuth, xlsxController.updateXlsxCurations);

router.route('/xml-generator')
  .post(isAuth, xlsxController.getXlsxCurations);

router.route('/xml-submit')
  .post(isAuth, xlsxController.getXlsxCurations);

module.exports = router;
