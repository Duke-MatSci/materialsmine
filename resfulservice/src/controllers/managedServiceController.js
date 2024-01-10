const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { errorWriter } = require('../utils/logWriter');
const { ManagedServiceRegister } = require('../../config/constant');
const { signToken } = require('../utils/jwtService');
const latency = require('../middlewares/latencyTimer');

/**
 * getDynamfitChartData - Retrieves dynamfit chart data
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.getDynamfitChartData = async (req, res, next) => {
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
          `${appName} service not available`,
          'getDynamfitChartData',
          422
        )
      );
    }

    if (appName === 'dynamfit') {
      req.timer = '1m';
      const token = signToken(req, { reqId });
      const response = await axios.post(
        `${req.env?.MANAGED_SERVICE_ADDRESS}${ManagedServiceRegister[appName]}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      logger.info(`${appName}::${reqId}::${response.headers?.latency}`);
      if (response.status === 200) {
        console.log(JSON.stringify(response));
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
    }
  } catch (error) {
    // console.log(error);
    next(
      errorWriter(
        req,
        `${
          error.message ??
          'This response indicates an unexpected server-side issue'
        }`,
        'getDynamfitChartData',
        500
      )
    );
  }
};
