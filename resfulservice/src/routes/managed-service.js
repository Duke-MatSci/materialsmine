const express = require('express');
const router = express.Router();
const manageServiceController = require('../controllers/managedServiceController');
const isAuth = require('../middlewares/isAuth');
const { latencyTimer } = require('../middlewares/latencyTimer');

router
  .route('/:appName')
  .post(isAuth, latencyTimer, manageServiceController.getDynamfitChartData);

module.exports = router;
