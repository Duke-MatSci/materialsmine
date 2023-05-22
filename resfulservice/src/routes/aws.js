const express = require('express');
const router = express.Router();
const { getAllDatasetNames, fetchDatasets } = require('../controllers/awsController');

router.route('/:bucketName').get(getAllDatasetNames);
router.route('/:bucketName/:fileName').get(fetchDatasets);

module.exports = router;
