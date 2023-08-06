const express = require('express');
const router = express.Router();
const curationController = require('../controllers/curationController');
const isAuth = require('../middlewares/isAuth');
const { latencyTimer } = require('../middlewares/latencyTimer');
const { validateXlsxObjectUpdate, validateXlsxObjectDelete, validateXlsxObjectGet } = require('../middlewares/validations');

router.route('')
  .get(isAuth, latencyTimer, curationController.getCurationSchemaObject)
  .post(isAuth, latencyTimer, curationController.curateXlsxSpreadsheet)
  .put(validateXlsxObjectUpdate, isAuth, latencyTimer, curationController.updateXlsxCurations)
  .delete(validateXlsxObjectDelete, isAuth, curationController.deleteXlsxCurations);

router.route('/bulk')
  .post(isAuth, latencyTimer, curationController.bulkXlsxCurations);
router.route('/get')
  .get(validateXlsxObjectGet, isAuth, latencyTimer, curationController.getXlsxCurations);

router.route('/admin')
  .post(isAuth, curationController.approveCuration);

router.route('rehydrate')
  .patch(isAuth, curationController.curationRehydration);

module.exports = router;
