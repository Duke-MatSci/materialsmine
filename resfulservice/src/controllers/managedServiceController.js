const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const { errorWriter } = require('../utils/logWriter');
const { ManagedServiceRegister } = require('../../config/constant');
const { signToken, decodeToken } = require('../utils/jwtService');
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

exports.dbRequest = async (req, res, next) => {
  const {
    logger,
    params: { collectionName },
    body: { action, payload, findBy },
    headers
  } = req;
  logger.info('dbRequest(): Function entry');
  const authHeader = headers.authorization;
  try {
    const token = authHeader && authHeader.split(' ')[1];
    const decoded = token && decodeToken(req, token);
    const modelNames = mongoose.modelNames();
    if (!modelNames.includes(collectionName)) {
      if (action === 'INSERTMANY') {
        require(`../models/${collectionName}`);
      } else {
        latency.latencyCalculator(res);
        return next(
          errorWriter(
            req,
            `${collectionName} empty. Needs seeding`,
            'dbRequest',
            404
          )
        );
      }
    }
    const Model = mongoose.model(collectionName);

    if (action === 'INSERTMANY') {
      await Model.deleteMany();
    }

    let result;
    let key, value;
    switch (action) {
      case 'INSERT':
        if (payload.length > 1) {
          result = await Model.insertMany(payload);
        } else {
          result = await Model.create(payload[0]);
        }
        break;
      case 'INSERTMANY':
        result = await Model.insertMany(payload);
        break;
      case 'DELETE':
        result = await Model.findOneAndDelete(findBy);
        break;
      case 'UPDATE':
        result = await Model.findOneAndUpdate(findBy, payload[0], {
          new: true
        });
        break;
      case 'SEARCH':
        key = Object.keys(findBy)[0];
        value = findBy[key];
        result = await Model.find({ [key]: new RegExp(`\\b${value}\\b`, 'i') });
        break;
      default:
        result = await Model.find(findBy);
    }

    if (!result && (action === 'UPDATE' || action === 'DELETE')) {
      latency.latencyCalculator(res);
      next(errorWriter(req, `${collectionName} not found`, 'dbRequest', 404));
    } else {
      logger.notice('dbRequest(): Result: ', result);
      if (decoded) res.header('responseid', decoded.requestid);
      latency.latencyCalculator(res);
      return res.status(200).json(result);
    }
  } catch (error) {
    if (error.code === 11000) {
      const exists = error.message.split(':').pop().replace('}', '');
      next(
        errorWriter(
          req,
          `${collectionName} ${exists} already exists`,
          'dbRequest',
          409
        )
      );
    }
    next(errorWriter(req, error.message, 'dbRequest', 500));
  }
};
