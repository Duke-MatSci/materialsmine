const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { errorWriter } = require('../utils/logWriter');
const { ManagedServiceRegister } = require('../../config/constant');
const { signToken } = require('../utils/jwtService');
const latency = require('../middlewares/latencyTimer');
const { validateIsAdmin } = require('../middlewares/validations');

/**
 * getDynamfitChartData - Retrieves dynamfit chart data
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.manageServiceRequest = async (req, res, next) => {
  const {
    logger,
    params: { appName },
    body
  } = req;
  logger.info('getDynamfitChartData Function Entry:');
  const reqId = uuidv4();
  logger.info(`${appName}::${JSON.stringify({ ...body, reqId })}`);
  try {
    if (!ManagedServiceRegister[appName]) {
      return next(
        errorWriter(
          req,
          `${
            appName[0].toUpperCase() + appName.slice(1)
          } service not available`,
          'getDynamfitChartData',
          422
        )
      );
    }

    req.reqId = reqId;
    req.url = `${req.env?.MANAGED_SERVICE_ADDRESS}${ManagedServiceRegister[appName]}`;
    return await _managedServiceCall(req, res);
  } catch (error) {
    const statusCode = error?.response?.status ?? 500;
    next(
      errorWriter(
        req,
        `${
          error?.response?.data?.message ??
          error?.message ??
          'This response indicates an unexpected server-side issue'
        }`,
        'getDynamfitChartData',
        statusCode
      )
    );
  }
};

/**
 * chemPropsSeed - Seeds chemprops data into the database
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.chemPropsSeed = async (req, res, next) => {
  validateIsAdmin(req, res, next);
  const { logger } = req;
  logger.info('chemPropsSeed(): Function entry');
  req.params.appName = req.originalUrl.split('/mn').pop();
  req.url = `${req.env?.MANAGED_SERVICE_ADDRESS}${req.params.appName}/`;
  req.reqId = uuidv4();
  logger.info(`chemProps::${JSON.stringify({ reqId: req.reqId })}`);
  try {
    return await _managedServiceCall(req, res);
  } catch (error) {
    const statusCode = error?.response?.status ?? 500;
    next(
      errorWriter(
        req,
        `${
          error?.response?.data?.message ??
          error?.message ??
          'This response indicates an unexpected server-side issue'
        }`,
        'getDynamfitChartData',
        statusCode
      )
    );
  }
};

const _managedServiceCall = async (req, res) => {
  const {
    reqId,
    url,
    body,
    params: { appName },
    logger
  } = req;
  req.timer = '1m';
  const token = signToken(req, { reqId });
  const response = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  logger.info(`${appName}::${reqId}::${response.headers?.latency}`);
  if (response.status === 200) {
    const errorObj = {};
    if (response.headers.responseid !== reqId) {
      errorObj.error = {
        code: 'MM00010',
        email: undefined,
        description: `This upload has been identified as potentially untrusted. 
              We were unable to verify its origin from the anticipated source`
      };
      errorObj.systemEmail = req.env?.SYSTEM_EMAIL;
    }
    const output = { ...errorObj, ...response.data, appName };
    logger.notice(`${appName}::${reqId}::${response.data}`);
    latency.latencyCalculator(res);
    return res.status(200).json(output);
  } else {
    logger.notice(`${appName}::${reqId}::${response.data}`);
    latency.latencyCalculator(res);
    return res.status(response.status).json(response.data);
  }
};
