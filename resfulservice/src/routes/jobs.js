const express = require('express');
const router = express.Router();
const JobsController = require('../controllers/jobs');
const isAuth = require('../middlewares/isAuth');
const { latencyTimer } = require('../middlewares/latencyTimer');

router
  .route('/xml/adjust-status')
  .post(isAuth, latencyTimer, JobsController.adjustXmlStatus);

module.exports = router;
