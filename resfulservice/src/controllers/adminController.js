const elasticSearch = require('../utils/elasticSearch');
const { outboundRequest } = require('../controllers/kgWrapperController');
const iterator = require('../utils/iterator');
const DatasetId = require('../models/datasetId');
const User = require('../models/user');
const URI = require('../../config/uri');
const DatasetProperty = require('../models/datasetProperty');
const { default: axios } = require('axios');
const { successWriter, errorWriter } = require('../utils/logWriter');
/**
 * Initialize Elastic Search
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.initializeElasticSearch = async (req, res, next) => {
  const log = req.logger;
  log.info('initializeElasticSearch(): Function entry');
  try {
    const response = await elasticSearch.initES(req);
    successWriter(req, 'success', 'initializeElasticSearch');
    return res.status(200).json({
      data: response
    });
  } catch (err) {
    next(errorWriter(req, err, 'initializeElasticSearch', 500));
  }
};

/**
 * Bulk Load Elastic Search
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
const _loadBulkElasticSearch = async (req, res, next) => {
  const log = req.logger;
  log.info('_loadBulkElasticSearch(): Function entry');
  const body = JSON.parse(req?.body);
  const type = body?.type;
  const data = body?.data;

  if (!type || !data.length) {
    return next(errorWriter(req, 'Category type or doc array is missing', '_loadBulkElasticSearch', 422));
  }

  try {
    const total = data.length;
    let rejected = 0;
    for (const item of data) {
      const response = await elasticSearch.indexDocument(req, type, item);
      if (!response) {
        log.debug(`_loadBulkElasticSearch()::error: rejected - ${response.statusText}`);
        rejected = rejected + 1;
      }
    }
    await elasticSearch.refreshIndices(req, type);
    successWriter(req, 'success', '_loadBulkElasticSearch');
    return res.status(200).json({
      total,
      rejected
    });
  } catch (err) {
    next(errorWriter(req, err, '_loadBulkElasticSearch', 500));
  }
};

/**
 * Insert doc into Elastic Search
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.loadElasticSearch = async (req, res, next) => {
  const log = req.logger;
  log.info('loadElasticSearch(): Function entry');
  const body = JSON.parse(req?.body);
  const type = body?.type;
  const doc = body?.doc;

  if (!type || !doc) {
    return next(errorWriter(req, 'Category type or doc is missing', 'loadElasticSearch', 422));
  }

  try {
    const response = await elasticSearch.indexDocument(req, type, doc);
    await elasticSearch.refreshIndices(req, type);
    successWriter(req, 'success', 'loadElasticSearch');
    return res.status(200).json({
      response
    });
  } catch (err) {
    next(errorWriter(req, err, 'loadElasticSearch', 500));
  }
};

/**
 * Ping Elastic Search
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.pingElasticSearch = async (req, res, next) => {
  const log = req.logger;
  log.info('pingElasticSearch(): Function entry');
  try {
    const response = await elasticSearch.ping(log, 1);
    successWriter(req, 'success', 'pingElasticSearch');
    return res.status(200).json({
      response
    });
  } catch (err) {
    next(errorWriter(req, err, 'pingElasticSearch', 500));
  }
};

/**
 * Data dump into ES
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.dataDump = async (req, res, next) => {
  const log = req.logger;
  log.info('dataDump(): Function entry');

  try {
    const { type, data } = await outboundRequest(req, next);
    req.body = JSON.stringify({ type, data });

    return _loadBulkElasticSearch(req, res, next);
  } catch (err) {
    next(errorWriter(req, err, 'dataDump', 500));
  }
};

exports.bulkElasticSearchImport = (req, res, next) => {
  const log = req.logger;
  log.info('bulkElasticSearchImport(): Function entry');

  return _loadBulkElasticSearch(req, res, next);
};

/**
 * Populate datasetId table with existing data from datasets table
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.populateDatasetIds = async (req, res, next) => {
  const log = req.logger;
  log.info('populateDatasetIds(): Function entry');
  if (!req.internal) {
    return next(errorWriter(req, 'User is unauthorized', 'populateDatasetIds', 401));
  }

  const connDB = iterator.generateMongoUrl(req);
  if (!connDB) return next(errorWriter(req, 'DB error', 'populateDatasetIds'));

  try {
    const db = await iterator.dbConnectAndOpen(connDB, req?.env?.MM_DB);
    const Dataset = await db.collection('datasets');
    const datasets = await Dataset.find({});
    await iterator.iteration(datasets, async (arg) => {
      const user = await User.findOne({ userid: arg?.userid }).lean();
      const userExistInDatasetId = await DatasetId.findOne({ user: user._id });
      if (userExistInDatasetId?._id) {
        userExistInDatasetId.dataset.push(arg);
        await userExistInDatasetId.save();
        return;
      }
      const datasetId = new DatasetId({ user });
      datasetId.dataset.push(arg._id);
      await datasetId.save();
      return datasetId;
    }, 2);
    successWriter(req, { message: 'Successfully updated DatasetIds' }, 'populateDatasetIds');
    return res.status(201).json({ message: 'Successfully updated DatasetIds' });
  } catch (err) {
    next(errorWriter(req, err, 'populateDatasetIds', 500));
  }
};

/**
 * Populate dataset properties with existing data from the KG
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.populateDatasetProperties = async (req, res, next) => {
  const log = req.logger;
  log.info('populateDatasetProperties(): Function entry');
  try {
    const datasetPropertyCount = await DatasetProperty.find().countDocuments();
    if (datasetPropertyCount < 1) {
      let response = await axios({
        method: 'GET',
        url: URI.datasetProperties,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 200) {
        response = response.data.results.bindings.map(
          ({ Attribute, Label }) => ({ attribute: Attribute?.value, label: Label?.value })
        );
        await DatasetProperty.insertMany(response);
      }
    }
    successWriter(req, { message: 'Successfully updated dataset properties' }, 'populateDatasetProperties');
    return res.status(201).json({ message: 'Successfully updated dataset properties' });
  } catch (err) {
    next(errorWriter(req, err, 'populateDatasetProperties'));
  }
};

/**
 * Retrieve dataset properties KG
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.getDatasetProperties = async (req, res, next) => {
  const log = req.logger;
  log.info('getDatasetProperties(): Function entry');
  try {
    const datasetProperties = await DatasetProperty.find()
      .select('attribute label -_id');
    return res.status(200).json({ data: datasetProperties });
  } catch (err) {
    next(errorWriter(req, err, 'getDatasetProperties'));
  }
};
