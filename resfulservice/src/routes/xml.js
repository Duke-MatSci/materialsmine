const express = require('express');
const { latencyTimer } = require('../middlewares/latencyTimer');
const curationController = require('../controllers/curationController');
const router = express.Router();

router
  .route('/:controlID')
  .get(latencyTimer, curationController.getCurationXml);

module.exports = router;
