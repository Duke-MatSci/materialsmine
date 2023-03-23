const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const loginController = require('../controllers/loginController');
const isAuth = require('../middlewares/isAuth');

router
  .route('/es/bulk')
  .post(AdminController.bulkElasticSearchImport)
  .put(AdminController.dataDump)
  .delete(AdminController.dataDump);

router.route('/populate-datasets-properties')
  .get(AdminController.getDatasetProperties)
  .post(AdminController.populateDatasetProperties);

router.route('/populate-datasets')
  .post(isAuth, AdminController.populateDatasetIds);

router
  .route('/es')
  .get(AdminController.pingElasticSearch)
  .post(AdminController.initializeElasticSearch)
  .put(isAuth, AdminController.loadElasticSearch)
  .delete(AdminController.loadElasticSearch);

// Note: Not in use. Deprecated for authService.js route.
router.route('/login').post(loginController.login);
module.exports = router;
