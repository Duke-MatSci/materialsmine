const express = require('express');
const router = express.Router();
const manageServiceController = require('../controllers/managedServiceController');
const isAuth = require('../middlewares/isAuth');
const { managedServiceDBCall } = require('../middlewares/validations');
const { latencyTimer } = require('../middlewares/latencyTimer');

router
  .route('/chemprops/init')
  .post(isAuth, latencyTimer, manageServiceController.chemPropsSeed);

router
  .route('/:appName')
  .post(isAuth, latencyTimer, manageServiceController.manageServiceRequest);

router
  .route('/db/:collectionName')
  .post(managedServiceDBCall, latencyTimer, manageServiceController.dbRequest);

module.exports = router;
