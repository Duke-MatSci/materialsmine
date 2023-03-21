const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.route('/')
  .get(AuthController.authenticationService);

module.exports = router;
