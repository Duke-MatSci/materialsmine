const express = require('express');
const router = express.Router();
const curationController = require('../controllers/curationController');
const isAuth = require('../middlewares/isAuth');
const { validateXlsxObjectUpdate, validateXlsxObjectDelete } = require('../middlewares/validations');

router.route('')
  .get(isAuth, curationController.getCurationSchemaObject)
  .post(isAuth, curationController.curateXlsxSpreadsheet)
  .put(validateXlsxObjectUpdate, isAuth, curationController.updateXlsxCurations)
  .delete(validateXlsxObjectDelete, isAuth, curationController.deleteXlsxCurations);

router.route('/get/:xmlId/:xlsxObjectId')
  .get(isAuth, curationController.getXlsxCurations);

router.route('/admin')
  .post(isAuth, curationController.approveCuration);

router.route('rehydrate')
  .patch(isAuth, curationController.curationRehydration);

router.route('/getdoi/:doi([^/]*)')
  .get(curationController.getDoiInfo);

module.exports = router;
