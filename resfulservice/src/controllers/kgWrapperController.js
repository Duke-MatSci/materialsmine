const axios = require('axios');
const https = require('https');
const { SAMPLE, ARTICLE } = require('../../config/constant');

const httpsAgent = {
  rejectUnauthorized: false
};
const outboundRequest = async () => {
  const sampleResponse = await axios({
    method: 'get',
    url: SAMPLE,
    httpsAgent: new https.Agent(httpsAgent)
  });
  const articleResponse = await axios({
    method: 'get',
    url: ARTICLE,
    httpsAgent: new https.Agent(httpsAgent)
  });
  return {
    sampleResponse: sampleResponse?.data,
    articleResponse: articleResponse?.data
  };
};

/**
 * getKnowledge - Retrieves data from the KG
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.getFacetValues = async (req, res, next) => {
  try {
    const response = await outboundRequest();
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
