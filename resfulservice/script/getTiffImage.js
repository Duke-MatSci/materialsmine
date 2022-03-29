const mongoose = require('mongoose');
const storedFiles = require('../src/models/fsFiles');
const env = process.env;

/**
 * Ensure the environment variable is set
 */

const db = mongoose.connection

async function getImagesFromMongo () {
  try {
    await mongoose.connect(`mongodb://${env.MM_MONGO_USER}:${env.MM_MONGO_PWD}@localhost:${env.MONGO_PORT}/${env.MM_DB}`, {keepAlive: true, keepAliveInitialDelay: 300000});
    db.on('error', () => console.log('An error occurred'));
    db.once('open', () => console.log('Open successfully'));
    console.log('ran out')
  } catch (err) {
    throw err
  }
  // mongoose
  //   .connect(`mongodb://${env.MM_MONGO_USER}:${env.MM_MONGO_PWD}@localhost:${env.MONGO_PORT}/${env.MM_DB}`, {
  //     useNewUrlParser: true, useUnifiedTopology: true
  //   })
  //   .then(async() => {
  //     const foundFiles = await storedFiles.find({"filename": {$regex : ".tif"}}).limit(1);
  //     console.log(foundFiles);
  //     return foundFiles;
  //   }).catch (err => {
  //     throw err;
  //   })
}

getImagesFromMongo();