const express = require('express');
// const { body } = require('express-validator');

const testController = require('../controllers/test');

const router = express.Router();

router.get('/', testController.testUser);

module.exports = router;
