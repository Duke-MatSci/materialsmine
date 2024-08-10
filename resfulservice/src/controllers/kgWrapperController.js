const axios = require('axios');
const https = require('https');
const constant = require('../../config/constant');
const { setInternal } = require('../middlewares/isInternal');
const elasticSearch = require('../utils/elasticSearch');
const { errorWriter, successWriter } = require('../utils/logWriter');
const { cacheKnowledge } = require('../middlewares/knowledge-cache');
const { stringifyError } = require('../utils/exit-utils');

const httpsAgent = {
  rejectUnauthorized: false
};

const _createOutboundJwt = (req, res, next) => {
  const log = req.logger;
  if (!req.user) {
    log.info('_createOutboundJwt(): User is unauthorized');
    return;
  }

  const displayName = req.user.displayName;
  const mail = req.user.email;

  const jwToken = setInternal(req, {
    givenName: displayName,
    mail,
    isAdmin: req.user?.isAdmin ?? false,
    sub: req.user._id,
    sn: displayName
  });

  return `token=${jwToken}`;
};

const _outboundRequest = async (req, next) => {
  const log = req.logger;
  log.info('_outboundRequest(): Function entry');

  if (!req.env.KNOWLEDGE_ADDRESS) {
    return next(
      errorWriter(
        req,
        'Knowledge endpoint address missing',
        '_outboundRequest',
        422
      )
    );
  }

  const query = req?.query;
  const type = query?.type;
  let url = query?.uri;
  let altMethod;

  if (!query?.uri && !type) {
    return next(
      errorWriter(req, 'Category type is missing', '_outboundRequest', 422)
    );
  }

  if (!url) {
    url = `${req.env.KNOWLEDGE_ADDRESS}/${constant[type]}`;
    altMethod = 'get';
  }

  if (query?.type && query.limit) {
    url = `${url}&limit=${query.limit}`;
  }

  if (query?.type && query.offset) {
    url = `${url}&offset=${query.offset}`;
  }

  const preparedRequest = {
    method: altMethod ?? req.method,
    httpsAgent: new https.Agent(httpsAgent),
    url
  };

  if (query?.queryString) {
    preparedRequest.params = {
      query: query.queryString
    };
  }

  if (req.isBackendCall || req.query?.responseType === 'json') {
    preparedRequest.headers = {
      accept: 'application/sparql-results+json'
    };
  }

  if (!['get'].includes(preparedRequest.method?.toLowerCase())) {
    // Check if call is not from sparql ui
    if (!req.query.queryString && req.knowlegeGraphPayloadBody) {
      preparedRequest.data = req.knowlegeGraphPayloadBody;
    }

    if (req.outboundCookie) {
      preparedRequest.headers = {
        ...preparedRequest.headers,
        // eslint-disable-next-line quote-props
        Cookie: req.outboundCookie,
        'Content-Type': 'application/ld+json',
        // eslint-disable-next-line quote-props
        accept: 'application/sparql-results+json'
      };
      preparedRequest.withCredentials = 'true';
    }
  }
  try {
    const response = await axios(preparedRequest);
    return {
      type,
      data: response?.data
    };
  } catch (err) {
    log.error(`_outboundRequest(): ${err.status || 500} - ${err}`);
    throw err;
  }
};

exports.outboundRequest = async (req, next) => {
  const log = req.logger;
  log.info('outboundRequest(): Function entry');
  try {
    return _outboundRequest(req, next);
  } catch (err) {
    log.error(`outboundRequest(): ${err.status || 500} - ${err}`);
    throw err;
  }
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
    successWriter(
      req,
      { message: 'Fetched graph successfully!' },
      'getKnowledge'
    );
    return res.status(200).json({
      message: 'Fetched graph successfully!'
    });
  } catch (err) {
    next(errorWriter(req, err, 'getKnowledge'));
  }
};

/**
 * getSparql - Retrieves data from the KG via SPARQL query
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response.data
 */
exports.getSparql = async (req, res, next) => {
  const log = req.logger;
  log.info('getSparql(): Function entry');
  const whyisPath = req.query.whyisPath;
  try {
    if (!req.env.KNOWLEDGE_ADDRESS) {
      return next(
        errorWriter(req, 'Knowledge endpoint address missing', 'getSparql', 422)
      );
    }

    req.query.queryString = req.body.query ?? req.query.query;
    req.query.uri = `${req.env.KNOWLEDGE_ADDRESS}/${constant.sparql}`;

    if (whyisPath) {
      // Append whyis paths before making a request call
      req.query.uri = `${req.env.KNOWLEDGE_ADDRESS}/${whyisPath}`;

      // The request body returns an array
      req.knowlegeGraphPayloadBody = req.body;

      const cookieValue = _createOutboundJwt(req, res, next);
      if (cookieValue) {
        req.outboundCookie = cookieValue;
      }
    }

    successWriter(req, { message: 'sending request' }, 'getSparql');
    const response = await _outboundRequest(req, next);

    successWriter(req, { message: 'success' }, 'getSparql');

    // Caching starts...
    if (response.data?.results?.bindings.length) {
      await cacheKnowledge(req, res, next, response?.data);
    } else {
      log.info(
        `getSparql = () => Empty knowledge response (${stringifyError(
          response.data?.results
        )})`
      );
    }
    if (req.isBackendCall) return response?.data;

    return res.status(200).json({ ...response?.data });
  } catch (err) {
    next(errorWriter(req, err, 'getSparql'));
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
    const response = await elasticSearch.loadAllCharts(req, page, pageSize);
    successWriter(req, { message: 'success' }, 'getAllCharts');
    return res.status(200).json({
      data: response?.data?.hits?.hits,
      total: response?.data?.hits?.total?.value || 0
    });
  } catch (err) {
    next(errorWriter(req, err, 'getAllCharts'));
  }
};

/**
 * Load dataset gallery from elastic function
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.getAllDatasets = async (req, res, next) => {
  const page = parseInt(req?.query?.page) || 1;
  const pageSize = parseInt(req?.query?.pageSize) || 10;

  try {
    const response = await elasticSearch.loadAllDatasets(req, page, pageSize);
    successWriter(req, { message: 'success' }, 'getAllDatasets');
    return res.status(200).json({
      data: response?.data?.hits?.hits || [],
      total: response?.data?.hits?.total?.value || 0
    });
  } catch (err) {
    next(errorWriter(req, err, 'getAllDatasets'));
  }
};

/**
 * Load images from knowledge graph
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.getInstanceFromKnowledgeGraph = async (req, res, next) => {
  try {
    const view = req.query?.view;
    let url;
    if (!view) url = `${req.env.KNOWLEDGE_ADDRESS}/about?uri=${req.query.uri}`;
    else {
      url = `${req.env.KNOWLEDGE_ADDRESS}/about?uri=${req.query.uri}&view=${view}`;
    }

    return axios
      .get(url, {
        responseType: 'arraybuffer'
      })
      .then((response) => {
        res.set({
          'Content-Type': response.headers['content-type'],
          'Content-Length': response.data.length
        });
        res.send(response.data);
      })
      .catch((err) => next(errorWriter(req, err, 'getAllCharts')));
  } catch (err) {
    next(errorWriter(req, err, 'getAllCharts'));
  }
};

exports.getDoiInfo = async (req, res, next) => {
  const { logger, params } = req;
  logger.info('_getDoiInfo(): Function entry');
  try {
    const { doi } = params;
    req.query.uri = `${constant.doiApi}${doi}`;
    const response = await _outboundRequest(req, next);
    successWriter(req, { message: 'success' }, 'getDoiInfo');

    const responseData = response?.data?.message;

    const filtered = Object.keys(responseData)
      .filter((key) => constant.doiFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = responseData[key];
        return obj;
      }, {});

    return res.status(200).json({ ...filtered });
  } catch (err) {
    next(errorWriter(req, err, 'getDoiInfo'));
  }
};

exports.searchRor = async (req, res, next) => {
  const { logger } = req;
  logger.info('_searchRor(): Function entry');
  try {
    if (req?.query?.query) {
      const term = req.query.query;
      req.query.uri = `${constant.rorApi}?query=${encodeURI(term)}`;
    } else if (req?.query?.id) {
      const term = req.query.id;
      req.query.uri = `${constant.rorApi}/${encodeURI(term)}`;
    } else throw new Error('Missing search value');

    const response = await _outboundRequest(req, next);
    successWriter(req, { message: 'success' }, 'searchRor');

    const responseData = response?.data?.items ?? [response?.data];
    const filtered = responseData.map((item) => {
      return Object.keys(item)
        .filter((key) => constant.rorFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = item[key];
          return obj;
        }, {});
    });
    return res.status(200).json(filtered);
  } catch (err) {
    next(errorWriter(req, err, 'searchRor'));
  }
};
