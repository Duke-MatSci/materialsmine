const axios = require('axios');
const https = require('https');
const constant = require('../../config/constant');
const elasticSearch = require('../utils/elasticSearch');

const httpsAgent = {
  rejectUnauthorized: false
};

const _outboundRequest = async (req, next) => {
  const log = req.logger;
  log.info('_outboundRequest(): Function entry');

  const query = req?.query;
  const type = query?.type;
  const uri = query?.uri || constant[type];

  if (!type) {
    const error = new Error('Category type is missing');
    error.statusCode = 422;
    log.error(`_outboundRequest(): ${error}`);
    return next(error);
  }

  if (!uri) {
    const error = new Error('URI is missing in the request body');
    error.statusCode = 422;
    log.error(`_outboundRequest(): ${error}`);
    return next(error);
  }

  const response = await axios({
    method: 'get',
    url: uri,
    httpsAgent: new https.Agent(httpsAgent)
  });

  return {
    type,
    data: response?.data
  };
};

exports.outboundRequest = async (req, next) => {
  const log = req.logger;
  log.info('outboundRequest(): Function entry');

  return _outboundRequest(req, next);
};

/**
 * getKnowledge - Retrieves data from the KG
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.getFacetValues = async (req, res, next) => {
  const log = req.logger;
  log.info('getFacetValues(): Function entry');
  try {
    const response = await _outboundRequest(req, next);
    return res.status(200).json({
      response
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    log.error(`getFacetValues(): ${err}`);
    next(err);
  }
};

/**
 * getKnowledge - Retrieves data from the KG
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.getKnowledge = async (req, res, next) => {
  try {
    return res.status(200).json({
      message: 'Fetched graph successfully!'
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

/**
 * Load chart gallery from elastic function
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.getAllCharts = async (req, res, next) => {
  const page = parseInt(req?.query?.page) || 1;
  const pageSize = parseInt(req?.query?.pageSize) || 10;

  try {
    const response = await elasticSearch.loadAllCharts(page, pageSize);
    return res.status(200).json({
      data: response?.data?.hits?.hits || [],
      total: response?.data?.hits?.total?.value || 0
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
