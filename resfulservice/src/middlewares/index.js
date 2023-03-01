// const bodyParser = require('body-parser');
// const acceptedHeaders = require('./accept');
// const getEnv = require('./parseEnv');
// const { fileMgr, fileServer } = require('./fileStorage');
// const { logParser, mmLogger } = require('./loggerService');

// const log = mmLogger();

// /**
//  * globalMiddleWare - this function that instantiate all
//  * global middleware services for the REST API
//  * @param {*} app Express app object
//  */
// const globalMiddleWare = async (app) => {
//   app.use(bodyParser.json());
//   app.use((req, res, next) => logParser(log, req, next));
//   app.use(fileMgr);
//   app.use('/mm_fils', fileServer);
//   app.use(acceptedHeaders);
//   app.use(getEnv);
// };

// /**
//  * This file imports all GLOBAL middleware services &
//  * exports them to the server.js file.
//  */
// module.exports = {
//   log,
//   globalMiddleWare
// };

const bodyParser = require('body-parser');
const acceptedHeaders = require('./accept');
const getEnv = require('./parseEnv');
const { fileMgr, fileServer } = require('./fileStorage');
const { logParser, mmLogger } = require('./loggerService');

const log = mmLogger();

/**
 * globalMiddleWare - this function that instantiate all
 * global middleware services for the REST API
 * @param {*} app Express app object
 */
const globalMiddleWare = async (app) => {
  app.use(bodyParser.json());
  app.use((req, res, next) => logParser(log, req, next));
  app.use(fileMgr);
  app.use('/mm_fils', fileServer);
  app.use(acceptedHeaders);
  app.use(getEnv);
};

/**
 * This file imports all GLOBAL middleware services &
 * exports them to the server.js file.
 */
module.exports = {
  log,
  globalMiddleWare
};
