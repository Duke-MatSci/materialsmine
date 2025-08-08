const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const { errorWriter } = require('../utils/logWriter');
const {
  ManagedServiceRegister,
  MGD_SVC_ERR_CODE
} = require('../../config/constant');
const { signToken, decodeToken } = require('../utils/jwtService');
const latency = require('../middlewares/latencyTimer');
const { validateIsAdmin } = require('../middlewares/validations');
// const { parseXmlAndExtractTables } = require('../utils/iterator');
const CuratedSamples = require('../models/curatedSamples');
const { loadViscoelasticPropPipeline } = require('../pipelines/xml-pipeline');
const path = require('path');
// const xmlData = require('../models/xmlData');

/**
 * getDynamfitChartData - Retrieves dynamfit chart data
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.manageServiceRequest = async (req, res, next) => {
  const { logger, params, body } = req;
  const [appName, controlId] = params.appName?.split('/');
  logger.info(':::manageServiceRequest Function Entry');
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
          'manageServiceRequest',
          422
        )
      );
    }

    req.reqId = reqId;
    if (appName === 'loadxml') {
      req.url = `${req.env?.MANAGED_SERVICE_ADDRESS}${ManagedServiceRegister.dynamfit}`;
    } else if (!controlId) {
      req.url = `${req.env?.MANAGED_SERVICE_ADDRESS}${ManagedServiceRegister[appName]}`;
    } else {
      req.url = `${req.env?.MANAGED_SERVICE_ADDRESS}${ManagedServiceRegister[appName]}${controlId}`;
    }
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
        'manageServiceRequest',
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
  logger.info('::::chemPropsSeed Function entry');
  req.params.appName = req.originalUrl.split('/mn').pop();
  req.url = `${req.env?.MANAGED_SERVICE_ADDRESS}${req.params.appName}/`;
  req.reqId = uuidv4();

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
        'chemPropsSeed',
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
    method = 'post',
    logger
  } = req;
  req.timer = '1m';
  const token = signToken(req, { reqId });

  // Check if user wants to use our sample file
  let reqBody = body;
  if (body.useSample) {
    // overwrite req.body.file_name with test file
    const { useSample, ...remainingBody } = body;
    reqBody = remainingBody;
    reqBody.file_name = req.env.DYNAMFIT_TEST_FILE;
  }

  if (appName === 'loadxml') {
    const { id, domain, index, ...remainingBody } = body;
    logger.info('_handleLoadXml: Function entry');

    if (!id || !domain || typeof index !== 'number') {
      return res.status(400).json({
        message:
          'Request body must include "title", "property", "table", and "index" (number)'
      });
    }
    // if (!title || !property || !table || typeof index !== 'number') {
    //   return res.status(400).json({
    //     message:
    //       'Request body must include "title", "property", "table", and "index" (number)'
    //   });
    // }

    // const result = await xmlData.findOne({ title });
    // if (!result || !result.xml_str) {
    //   return res.status(404).json({ message: 'No XML data found for title' });
    // }

    // const contains = await parseXmlAndExtractTables(result.xml_str, true);

    // // Apply filtering based on index
    // let filteredData = [];
    // if (index !== undefined && Array.isArray(contains)) {
    //   filteredData = contains[index] || [];
    // }

    // // Filter by property and table
    // if (property && table && filteredData.tables) {
    //   filteredData.tables = filteredData.tables.filter(
    //     (t) => t.name === table && t.properties?.includes(property)
    //   );
    // }

    // if (!filteredData.rows?.length === 0) {
    //   throw new Error('No data found for the given property and table');
    // }

    // // Convert JSON data to a worksheet
    // const worksheet = XLSX.utils.json_to_sheet(filteredData.rows);
    // // Convert the worksheet to CSV format
    // const csv = XLSX.utils.sheet_to_csv(worksheet);

    // // Generate a dynamic filename using a UUID
    // const fileName = `${filteredData.table || uuidv4()}.csv`;

    // // Set response headers for file download
    // res.setHeader('Content-Type', 'text/csv');
    // res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const outputDir = '/app/mm_files/';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${id}_${index}.csv`;
    const filePath = path.join(outputDir, fileName);

    // Skip if file exists
    if (fs.existsSync(filePath)) {
      logger.notice(`⚠️ File already exists: ${fileName}, skipping.`);
    } else {
      const data = await CuratedSamples.aggregate(
        loadViscoelasticPropPipeline({ id, includeRows: true })
      );

      if (!data) {
        throw new Error('No data found for the given ID');
      }

      const containsItem = data[0]?.xmls[0]?.contains[index];
      if (!containsItem) {
        throw new Error('No data found for the given index');
      }

      // Only extract _text values from columns
      const flattened = containsItem.rows.map((row) =>
        row.column.map((col) => col._text)
      );

      // Convert to worksheet (no headers, just pure data rows)
      const worksheet = XLSX.utils.aoa_to_sheet(flattened);

      // Create a workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      // Write to CSV
      XLSX.writeFile(workbook, filePath, { bookType: 'csv' });
      logger.info(`New Dynamfit file created: ${filePath}`);
    }
    reqBody = remainingBody;
    reqBody.file_name = fileName;
  }

  const response = await axios.request({
    method,
    url,
    data: reqBody,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // mgdsvc = managed services
  logger.info(
    `mgdsvc.${appName} = (${reqId}) => response.status(${response.status})`
  );
  if (response.status === 200) {
    if (response.headers['content-type'] === 'text/yaml; charset=utf-8') {
      res.setHeader('Content-Type', response.headers['content-type']);
      return res.send(response.data);
      // return res.status(200).json({ yamlString: YAML.stringify(yamlString) });
    }
    const errorObj = {};
    if (response.headers.responseid !== reqId) {
      errorObj.error = {
        ...MGD_SVC_ERR_CODE.default,
        email: undefined
      };

      errorObj.systemEmail = req.env?.SYSTEM_EMAIL;
    }
    const output = { ...errorObj, ...response.data, appName };
    latency.latencyCalculator(res);
    return res.status(200).json(output);
  } else {
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
