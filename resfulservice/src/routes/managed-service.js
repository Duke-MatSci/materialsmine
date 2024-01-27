const express = require('express');
const router = express.Router();
const manageServiceController = require('../controllers/managedServiceController');
const isAuth = require('../middlewares/isAuth');
const { latencyTimer } = require('../middlewares/latencyTimer');

router
  .route('/:appName')
  .post(isAuth, latencyTimer, manageServiceController.manageServiceRequest);

router
  .route('/chemprops/init')
  .post(isAuth, latencyTimer, manageServiceController.chemPropsSeed);

module.exports = router;
