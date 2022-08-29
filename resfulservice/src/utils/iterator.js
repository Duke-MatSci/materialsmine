const MongoClient = require('mongodb').MongoClient;

exports.dbConnectAndOpen = (mongoUrl, dbName) => {
  const dbconn = new Promise(function (resolve, reject) {
    MongoClient.connect(mongoUrl, function (err, client) {
      const mongoClient = client;
      if (err) {
        const msg = 'dbConnectAndOpen() - error connecting to db: ' + mongoUrl + ' err: ' + err;
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
  const { DB_USERNAME, DB_PASSWORD, MONGO_ADDRESS, MONGO_PORT, MM_DB } = req?.env;
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
exports.iteration = (arr, iterationFn, batchSize) => new Promise((resolve, reject) => {
  let pendingPromises = [];
  const pausePromises = async () => {
    try {
      // eslint-disable-next-line no-extra-boolean-cast
      if (!!pendingPromises.length) {
        await Promise.all(pendingPromises);
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  };
  const arrStream = arr.stream();
  arrStream.on('data', async data => {
    pendingPromises.push(iterationFn(data));
    if (batchSize && pendingPromises.length >= batchSize) {
      arrStream.pause();
      await Promise.all(pendingPromises);
      pendingPromises = [];
      arrStream.resume();
    }
  });
  arrStream.on('error', error => {
    reject(error);
  });
  arrStream.on('end', () => {
    pausePromises();
  });
});
