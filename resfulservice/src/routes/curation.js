const express = require('express');
const router = express.Router();
const curationController = require('../controllers/curationController');
const isAuth = require('../middlewares/isAuth');
const { validateXlsxObjectUpdate } = require('../middlewares/validations');

router.route('')
  .get(isAuth, curationController.getCurationSchemaObject)
  .post(isAuth, curationController.curateXlsxSpreadsheet)
  .put(validateXlsxObjectUpdate, isAuth, curationController.updateXlsxCurations);

router.route('/edit')
  .get(isAuth, curationController.getXlsxCurations);

router.route('/xml-generator')
  .post(isAuth, curationController.getXlsxCurations);

router.route('/xml-submit')
  .post(isAuth, curationController.getXlsxCurations);

module.exports = router;
