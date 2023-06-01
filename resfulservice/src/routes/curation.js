const express = require('express');
const router = express.Router();
const curationController = require('../controllers/curationController');
const isAuth = require('../middlewares/isAuth');
const { validateXlsxObjectUpdate } = require('../middlewares/validations');

router.route('')
  .get(isAuth, curationController.getCurationSchemaObject)
  .post(isAuth, curationController.curateXlsxSpreadsheet)
  .put(validateXlsxObjectUpdate, isAuth, curationController.updateXlsxCurations);

router.route('/:xmlId/:xlsxObjectId')
  .get(isAuth, curationController.getXlsxCurations);

router.route('/admin')
  .post(isAuth, curationController.approveCuration);

router.route('rehydrate')
  .patch(isAuth, curationController.curationRehydration);

module.exports = router;
