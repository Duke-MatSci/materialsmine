const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { getInternal } = require('../middlewares/isInternal');

router.route('/es')
  // .get(getInternal, AdminController.pingElasticSearch)
  // .post(getInternal, AdminController.initializeElasticSearch);
  .get(AdminController.pingElasticSearch)
  .post(AdminController.initializeElasticSearch)
  .put(AdminController.loadElasticSearch);

router.route('/es/bulkinsert')
  // .get(getInternal, AdminController.pingElasticSearch)
  // .post(getInternal, AdminController.initializeElasticSearch);
  .post(AdminController.loadBulkElasticSearch);

module.exports = router;
