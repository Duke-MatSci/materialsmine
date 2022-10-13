const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const loginController = require('../controllers/loginController');
const { getInternal } = require('../middlewares/isInternal');

router
  .route('/es/bulkinsert')
  // .get(getInternal, AdminController.pingElasticSearch)
  // .post(getInternal, AdminController.initializeElasticSearch);
  .post(AdminController.bulkElasticSearchImport)
  .put(AdminController.dataDump);

router.route('/populate-datasets-properties')
  .get(AdminController.getDatasetProperties)
  .post(AdminController.populateDatasetProperties);

router.route('/populate-datasets')
  .post(getInternal, AdminController.populateDatasetIds);

router
  .route('/es')
  // .get(getInternal, AdminController.pingElasticSearch)
  // .post(getInternal, AdminController.initializeElasticSearch);
  .get(AdminController.pingElasticSearch)
  .post(AdminController.initializeElasticSearch)
  .put(getInternal, AdminController.loadElasticSearch);

router.route('/login').post(loginController.login);
module.exports = router;
