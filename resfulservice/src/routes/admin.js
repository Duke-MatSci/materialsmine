const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const loginController = require('../controllers/loginController');
const isAuth = require('../middlewares/isAuth');
const { latencyTimer } = require('../middlewares/latencyTimer');

router
  .route('/es/bulk')
  .post(AdminController.bulkElasticSearchImport)
  .put(AdminController.dataDump)
  .delete(AdminController.dataDump);

router
  .route('/populate-datasets-properties')
  .get(AdminController.getDatasetProperties)
  .post(isAuth, AdminController.populateDatasetProperties);

router
  .route('/populate-datasets')
  .post(isAuth, AdminController.populateDatasetIds);

router
  .route('/es')
  .get(isAuth, AdminController.pingElasticSearch)
  .post(isAuth, AdminController.initializeElasticSearch)
  .put(isAuth, AdminController.loadElasticSearch)
  .delete(isAuth, AdminController.loadElasticSearch);

router.route('/store').get(AdminController.loadObjectStore);

router
  .route('/deployment/tags')
  .get(isAuth, latencyTimer, AdminController.deploymentTags);

router
  .route('/deployment/general')
  .post(isAuth, latencyTimer, AdminController.generalDeployment);

router
  .route('/deployment/ontology')
  .post(isAuth, latencyTimer, AdminController.ontologyDeployment);

router
  .route('/deployment/status/:deploymentType')
  .get(isAuth, latencyTimer, AdminController.deploymentStatus);

// Note: Not in use. Deprecated for authService.js route.
router.route('/login').post(loginController.login);
module.exports = router;
