const express = require('express');
const router = express.Router();
const curationController = require('../controllers/curationController');
const isAuth = require('../middlewares/isAuth');
const { latencyTimer } = require('../middlewares/latencyTimer');
const {
  validateXlsxObjectUpdate,
  validateXlsxObjectDelete,
  validateXlsxObjectGet,
  validateApproveCuration,
  validateCreateChangeLog,
  validateGetChangeLogs
} = require('../middlewares/validations');

router
  .route('')
  .get(
    isAuth,
    latencyTimer,
    curationController.getCurationSchemaObject,
    curationController.getCurationXSD
  )
  .post(isAuth, latencyTimer, curationController.curateXlsxSpreadsheet)
  .put(
    validateXlsxObjectUpdate,
    isAuth,
    latencyTimer,
    curationController.updateXlsxCurations
  )
  .delete(
    validateXlsxObjectDelete,
    isAuth,
    latencyTimer,
    curationController.deleteXlsxCurations
  );

router.route('/schema').get(latencyTimer, curationController.getCurationXSD);

router
  .route('/changelogs/:resourceId')
  .post(
    validateCreateChangeLog,
    isAuth,
    latencyTimer,
    curationController.createChangeLog
  )
  .get(validateGetChangeLogs, latencyTimer, curationController.getChangeLogs);

router
  .route('/bulk')
  .post(isAuth, latencyTimer, curationController.bulkXlsxCurations);
router
  .route('/get/:curationId')
  .get(
    validateXlsxObjectGet,
    isAuth,
    latencyTimer,
    curationController.getXlsxCurations
  );

router
  .route('/duplicate/:curationId')
  .post(isAuth, latencyTimer, curationController.duplicateXlsxCuration);

router
  .route('/approval')
  .post(
    validateApproveCuration,
    isAuth,
    latencyTimer,
    curationController.approveCuration
  );

router
  .route('/newsampleid')
  .post(isAuth, latencyTimer, curationController.getControlSampleId);

router.route('/xml').post(isAuth, latencyTimer, curationController.curateXml);

router.route('rehydrate').patch(isAuth, curationController.curationRehydration);

module.exports = router;
