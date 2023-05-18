const express = require('express');
const router = express.Router();
const curationController = require('../controllers/curationController');
const isAuth = require('../middlewares/isAuth');
const { validateXlsxObjectUpdate } = require('../middlewares/validations');

router.route('')
  .get(isAuth, curationController.getCurationSchemaObject);

router.route('/new')
  .post(isAuth, curationController.curateXlsxSpreadsheet);

router.route('/get')
  .get(isAuth, curationController.getXlsxCurations);

router.route('/update/:xlsxObjectId')
  .put(validateXlsxObjectUpdate, isAuth, curationController.updateXlsxCurations);

router.route('/xml-generator')
  .post(isAuth, curationController.getXlsxCurations);

router.route('/xml-submit')
  .post(isAuth, curationController.getXlsxCurations);

module.exports = router;
