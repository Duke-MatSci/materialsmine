const express = require('express');
const { latencyTimer } = require('../middlewares/latencyTimer');
const curationController = require('../controllers/curationController');
const isAuth = require('../middlewares/isAuth');
const router = express.Router();

router
  .route('/:controlID')
  .get(latencyTimer, curationController.getCurationXml);

router
  .route('/xml-has-property')
  .post(isAuth, latencyTimer, curationController.loadXmlTable);

module.exports = router;
