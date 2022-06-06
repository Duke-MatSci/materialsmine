const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
// const loginController = require('../controllers/loginController');
const imageController = require('../controllers/imageController');
const { getInternal } = require('../middlewares/isInternal');
// const { validateLogin } = require('../middlewares/validateLoginData');
const { validateImageMigration, validateImageId } = require('../middlewares/validateImageMigration');

router
  .route('/es/bulkinsert')
  // .get(getInternal, AdminController.pingElasticSearch)
  // .post(getInternal, AdminController.initializeElasticSearch);
  .post(AdminController.bulkElasticSearchImport)
  .put(AdminController.dataDump);

router
  .route('/es')
  // .get(getInternal, AdminController.pingElasticSearch)
  // .post(getInternal, AdminController.initializeElasticSearch);
  .get(AdminController.pingElasticSearch)
  .post(AdminController.initializeElasticSearch)
  .put(getInternal, AdminController.loadElasticSearch);

// router.route('/login').post(validateLogin, loginController.login);
router.route('/image_migration/:imageType').get(validateImageMigration, imageController.imageMigration);
router.route('/image/:imageId').get(validateImageId, imageController.imageContent);
module.exports = router;
