const express = require('express');
const router = express.Router();
const { notFound } = require('../controllers/invalidController');

router.use(notFound);

module.exports = router;
