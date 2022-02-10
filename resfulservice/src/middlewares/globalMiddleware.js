const bodyParser = require('body-parser');
const acceptedHeaders = require('./accept');
const getEnv = require('./parseEnv');
const { fileMgr, fileServer } = require('./fileStorage');
const mmGraphQL = require('../graphql');
const { logParser, mmLogger } = require('./loggerService');

const log = mmLogger();

/**
 * globalMiddleWare - this function that instantiate all
 * global middleware services for the REST API
 * @param {*} app Express app object
 */
const globalMiddleWare = (app) => {
  app.use(bodyParser.json());
  app.use(fileMgr);
  app.use('/mm_fils', fileServer);
  app.use(acceptedHeaders);
  app.use('/graphql', mmGraphQL);
  app.use(getEnv);
  app.use(
    (req, res, next) => logParser(log, req, next)
  );
};

/**
 * This file imports all GLOBAL middleware services &
 * exports them to the server.js file.
 */
module.exports = {
  log,
  globalMiddleWare
};
