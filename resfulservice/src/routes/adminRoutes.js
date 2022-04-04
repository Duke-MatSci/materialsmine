const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { getInternal } = require('../middlewares/isInternal');

router.route('/es/bulkinsert')
  // .get(getInternal, AdminController.pingElasticSearch)
  // .post(getInternal, AdminController.initializeElasticSearch);
  .post(AdminController.bulkElasticSearchImport)
  .put(AdminController.dataDump);

router.route('/es')
  // .get(getInternal, AdminController.pingElasticSearch)
  // .post(getInternal, AdminController.initializeElasticSearch);
  .get(AdminController.pingElasticSearch)
  .post(AdminController.initializeElasticSearch)
  .put(getInternal, AdminController.loadElasticSearch);

module.exports = router;
