const express = require('express');
const acceptedHeaders = require('./accept');
const getEnv = require('./parseEnv');
const { fileMgr } = require('./fileStorage');
const { logParser, mmLogger } = require('./loggerService');
const swaggerService = require('./swagger-service');

const log = mmLogger();

/**
 * globalMiddleWare - this function that instantiate all
 * global middleware services for the REST API
 * @param {*} app Express app object
 */
const globalMiddleWare = async (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => logParser(log, req, next));
  app.use(fileMgr);
  app.use(acceptedHeaders);
  app.use(getEnv);
};

/**
 * This file imports all GLOBAL middleware services &
 * exports them to the server.js file.
 */
module.exports = {
  log,
  swaggerService,
  globalMiddleWare
};
