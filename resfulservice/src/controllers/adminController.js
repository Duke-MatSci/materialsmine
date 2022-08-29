const elasticSearch = require('../utils/elasticSearch');
const { outboundRequest } = require('../controllers/kgWrapperController');
const iterator = require('../utils/iterator');
const DatasetId = require('../models/datasetId');
const User = require('../models/user');
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
    return res.status(200).json({
      data: response
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
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
    const error = new Error('Category type or doc array is missing');
    error.statusCode = 422;
    log.error(`_loadBulkElasticSearch(): error ${error}`);
    return next(error);
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
    return res.status(200).json({
      total,
      rejected
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    log.error(`_loadBulkElasticSearch(): error ${err}`);
    next(err);
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
    const error = new Error('Category type or doc is missing');
    error.statusCode = 422;
    log.error(`initializeElasticSearch(): ${error}`);
    return next(error);
  }

  try {
    const response = await elasticSearch.indexDocument(req, type, doc);
    await elasticSearch.refreshIndices(req, type);
    return res.status(200).json({
      response
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
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
    return res.status(200).json({
      response
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
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
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    log.info(`dataDump(): Error: ${err}`);
    next(err);
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
    const error = new Error('User is unauthorized');
    error.status = 401;
    return next(error);
  }

  const connDB = iterator.generateMongoUrl(req);
  if (!connDB) return next(new Error('DB error'));

  try {
    const db = await iterator.dbConnectAndOpen(connDB, req?.env?.MM_DB);
    const Dataset = await db.collection('datasets');
    const datasets = await Dataset.find({});
    // const existingDatasets = await Dataset.find({}).lean().limit(2);
    // const readableStream = Readable.from(existingDatasets);
    // // eslint-disable-next-line no-debugger
    // debugger;
    let counter = 0;
    await iterator.iteration(datasets, async (arg) => {
      const user = await User.findOne({ userid: arg?.userid }).lean();
      const userExistInDatasetId = await DatasetId.findOne({ user: user._id });
      if (userExistInDatasetId?._id) {
        counter = counter + 1;
        userExistInDatasetId.dataset.push(arg);
        await userExistInDatasetId.save();
        return;
      }
      counter = counter + 1;
      console.log('aa:', user);
      console.log('aa:', counter);
      const datasetId = new DatasetId({ user });
      datasetId.dataset.push(arg._id);
      await datasetId.save();
      return datasetId;
    }, 2);
    return res.status(201).json({ message: 'Successfully updated DatasetIds' });
  } catch (err) {
    log.error(`populateDatasetIds(): Error: ${err}`);
    next(err);
  }
};
