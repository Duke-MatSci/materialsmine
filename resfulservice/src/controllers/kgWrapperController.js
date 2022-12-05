const axios = require('axios');
const https = require('https');
const constant = require('../../config/constant');
const elasticSearch = require('../utils/elasticSearch');
const { errorWriter, successWriter } = require('../utils/logWriter');

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
    return next(errorWriter(req, 'Category type is missing', '_outboundRequest', 422));
  }

  if (!uri) {
    return next(errorWriter(req, 'URI is missing in the request body', '_outboundRequest', 422));
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
    successWriter(req, { message: 'success' }, 'getFacetValues');
    return res.status(200).json({
      response
    });
  } catch (err) {
    next(errorWriter(req, err, 'getFacetValues'));
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
    successWriter(req, { message: 'Fetched graph successfully!' }, 'getKnowledge');
    return res.status(200).json({
      message: 'Fetched graph successfully!'
    });
  } catch (err) {
    next(errorWriter(req, err, 'getKnowledge'));
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
    successWriter(req, { message: 'success' }, 'getAllCharts');
    return res.status(200).json({
      data: response?.data?.hits?.hits || [],
      total: response?.data?.hits?.total?.value || 0
    });
  } catch (err) {
    next(errorWriter(req, err, 'getAllCharts'));
  }
};
