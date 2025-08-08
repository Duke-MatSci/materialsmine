const MongoClient = require('mongodb').MongoClient;
const xml2js = require('xml2js');

exports.dbConnectAndOpen = (mongoUrl, dbName) => {
  const dbconn = new Promise(function (resolve, reject) {
    MongoClient.connect(mongoUrl, function (err, client) {
      const mongoClient = client;
      if (err) {
        const msg =
          'dbConnectAndOpen() - error connecting to db: ' +
          mongoUrl +
          ' err: ' +
          err;
        reject(msg);
      } else {
        const db = mongoClient.db(dbName);
        resolve(db);
      }
    });
  });
  return dbconn;
};

/**
 * MongoDB URL string generator
 * @param {*} req
 * @returns {String}
 */
exports.generateMongoUrl = (req) => {
  const { DB_USERNAME, DB_PASSWORD, MONGO_ADDRESS, MONGO_PORT, MM_DB } =
    req?.env;
  if (!DB_USERNAME || !DB_PASSWORD) return undefined;
  return `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${MONGO_ADDRESS}:${MONGO_PORT}/${MM_DB}`;
};

/**
 * Iterator that runs a given method for each iteration
 * @param {*} arr Stream
 * @param {Function} iterationFn
 * @param {Number} batchSize
 * @returns {Promise}
 */
exports.iteration = (arr, iterationFn, batchSize) =>
  new Promise((resolve, reject) => {
    // const chunks: Buffer[] = arr;
    let pendingPromises = [];
    const pausePromises = async () => {
      try {
        if (pendingPromises.length) {
          await Promise.all(pendingPromises);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    const arrStream = arr.stream();
    arrStream.on('data', async (data) => {
      pendingPromises.push(iterationFn(data));
      if (batchSize && pendingPromises.length >= batchSize) {
        arrStream.pause();
        await Promise.all(pendingPromises);
        pendingPromises = [];
        arrStream.resume();
      }
    });
    arrStream.on('error', (error) => {
      reject(error);
    });
    arrStream.on('end', () => {
      pausePromises();
    });
  });

exports.parseXmlAndExtractTables = async (xml, returnRow = false) => {
  const parser = new xml2js.Parser({ explicitArray: true });
  const result = await parser.parseStringPromise(xml);

  // This will hold our final array of { property, table } objects.
  const tablesFound = [];

  // Get the root element.
  const polymer = result.PolymerNanocomposite;
  if (!polymer) return tablesFound;

  // Combine both PROPERTIES and PROCESSING sections if they exist.
  let roots = [];
  if (polymer.PROPERTIES) roots = roots.concat(polymer.PROPERTIES);
  if (polymer.PROCESSING) roots = roots.concat(polymer.PROCESSING);
  if (roots.length === 0) return tablesFound;

  // Helper to extract description text from a node (check both lowercase and capitalized).
  function getDescription (node) {
    if (node && typeof node === 'object') {
      const desc = node.description || node.Description;
      if (desc && Array.isArray(desc) && desc.length > 0) {
        const descItem = desc[0];
        if (typeof descItem === 'object' && '_' in descItem) {
          return descItem._;
        }
        if (typeof descItem === 'string') {
          return descItem;
        }
      }
    }
    return null;
  }

  // Helper to extract rows when has parameter is true
  function extractRows (node, headerNames) {
    const rowData = [];
    if (node.rows && Array.isArray(node.rows)) {
      const rowsNode = node.rows[0];
      if (rowsNode.row && Array.isArray(rowsNode.row)) {
        rowsNode.row.forEach((rowObj) => {
          const columns = rowObj.column || [];
          const record = {};
          for (let i = 0; i < headerNames.length; i++) {
            record[headerNames[i]] = columns[i] ? columns[i]._ : null;
          }
          rowData.push(record);
        });
      }
    }
    return rowData;
  }

  /**
   * Recursively walk through the XML object.
   *
   * @param {any} node - The current node (object or array).
   * @param {string|undefined} nodeName - The effective property name inherited from parent.
   */
  function walkProperties (node, nodeName) {
    if (Array.isArray(node)) {
      node.forEach((el) => walkProperties(el, nodeName));
      return;
    }
    if (node && typeof node === 'object') {
      // If this node has a headers property, process it immediately.
      if (
        node.headers &&
        Array.isArray(node.headers) &&
        node.headers[0] &&
        node.headers[0].column
      ) {
        const columns = node.headers[0].column;
        if (columns.length >= 2) {
          // Join all column texts with " vs " (so three columns will be joined accordingly)
          const headerNames = columns.map((col) => col._);
          const headersText = headerNames.join(' vs ');
          // Use the passed-in nodeName if available.
          tablesFound.push({
            property: nodeName,
            table: headersText,
            ...(returnRow ? { rows: extractRows(node, headerNames) } : {})
          });
        }
      }

      // Determine an effective name for children.
      let effectiveName = nodeName;
      const descText = getDescription(node);
      // If the current node itself has a description and nodeName is missing or generic, use it.
      if (
        descText &&
        (!effectiveName ||
          effectiveName === 'data' ||
          effectiveName === 'Temperature')
      ) {
        effectiveName = descText;
      }

      // Now iterate through all keys.
      for (const [childName, childValue] of Object.entries(node)) {
        // Skip processing description nodes here since we've already handled them.
        if (childName.toLowerCase() === 'description') continue;

        // For child nodes with key "data", process each element.
        if (childName === 'data' && Array.isArray(childValue)) {
          childValue.forEach((dataObj) => {
            // Check if this dataObj itself contains a description.
            let currentName = effectiveName;
            const innerDesc = getDescription(dataObj);
            if (innerDesc) {
              currentName = innerDesc;
            }
            walkProperties(dataObj, currentName);
          });
        } else {
          // For any other child, pass its key as the new nodeName.
          walkProperties(childValue, childName);
        }
      }
    }
  }

  // Start recursion from each root (from PROPERTIES and PROCESSING)
  roots.forEach((root) => walkProperties(root, undefined));

  return tablesFound;
};
