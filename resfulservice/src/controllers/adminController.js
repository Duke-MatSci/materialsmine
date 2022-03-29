const esConfig = require('../../config/esConfig');
const elasticSearch = require('../utils/elasticSearch');

/**
 * Initialize Elastic Search
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.initializeElasticSearch = async (req, res, next) => {
  const log = req.logger;
  try {
    const type = req?.body?.type;
    const schema = esConfig[type];
    if (!type || !schema) {
      const error = new Error('Category type is missing');
      error.statusCode = 422;
      log.error(`initializeElasticSearch(): ${error}`);
      return next(error);
    }
    const response = await elasticSearch.initES(req, type, schema);
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
exports.loadBulkElasticSearch = async (req, res, next) => {
  const log = req.logger;
  const body = JSON.parse(req?.body);
  const type = body?.type;
  const data = body?.data;

  if (!type || !data.length) {
    const error = new Error('Category type or doc array is missing');
    error.statusCode = 422;
    log.error(`initializeElasticSearch(): ${error}`);
    return next(error);
  }

  try {
    const total = data.length;
    let rejected = 0;
    for (const item of data) {
      const response = await elasticSearch.indexDocument(req, type, item);
      if (!response) {
        log.debug(`loadBulkElasticSearch()::error: rejected - ${response.statusText}`);
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
  try {
    const log = req.logger;
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
