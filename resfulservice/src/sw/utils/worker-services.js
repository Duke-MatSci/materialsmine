const sharp = require('sharp');
const fs = require('fs');
const axios = require('axios');
const CuratedSamples = require('../../models/curatedSamples');
const Task = require('../models/task');
const FileManager = require('../../utils/fileManager');
const KnowledgeController = require('../../controllers/kgWrapperController');
const minioClient = require('../../utils/minio');
const { log } = require('../../middlewares');
const {
  SupportedFileResponseHeaders,
  MinioBucket,
  TaskStatusMap
} = require('../../../config/constant');
const { stringifyError } = require('../../utils/exit-utils');

const env = process.env;
const BUCKETNAME = env.MINIO_BUCKET ?? MinioBucket;
const TIME_API_URL =
  'https://timeapi.io/api/Time/current/zone?timeZone=US/Eastern';

// Global variables to store the fetched time and date
let fetchedTime = null;
let fetchedDate = null;

// Function to fetch the current time from the API
async function fetchCurrentTime() {
  log.info('fetchCurrentTime(): Function entry');
  try {
    const response = await axios.get(TIME_API_URL);
    if (response.status === 200) {
      const data = response.data;
      log.info(`Fetched time: ${data.dateTime}`);
      fetchedTime = new Date(data.dateTime);
      fetchedDate = fetchedTime.toISOString().split('T')[0];
    } else {
      log.error('Failed to fetch time from the API');
      throw new Error('Failed to fetch time from the API');
    }
  } catch (error) {
    log.error(error);
  }
}

// Function to calculate the remaining time until 12:00 AM in the correct timezone
function getRemainingTimeUntilMidnight() {
  log.info('getRemainingTimeUntilMidnight(): Function entry');
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const nowInEST = new Date(now.getTime() - timezoneOffset + 3600000 * -5); // EST is UTC-5
  const nextMidnight = new Date(nowInEST);
  nextMidnight.setHours(0, 0, 0, 0);

  // If it's already past 12:00 AM today, set nextMidnight to 12:00 AM the next day
  if (nowInEST >= nextMidnight) {
    nextMidnight.setDate(nextMidnight.getDate() + 1);
  }

  return nextMidnight - nowInEST;
}

// Function to check if the current time is between 12:00 AM and 3:00 AM
function isNightTime() {
  log.info('isNightTime(): Function entry');
  if (fetchedTime !== null) {
    const startTime = new Date(fetchedTime);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(fetchedTime);
    endTime.setHours(3, 0, 0, 0);
    return fetchedTime >= startTime && fetchedTime < endTime;
  } else {
    return false;
  }
}

// Function to update fetched time and date periodically
async function updateTimeIfNecessary() {
  log.info('updateTimeIfNecessary(): Function entry');
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const nowInEST = new Date(now.getTime() - timezoneOffset + 3600000 * -5); // EST is UTC-5
  const currentDate = nowInEST.toISOString().split('T')[0];

  // Check if it's a new day
  if (fetchedDate !== currentDate) {
    await fetchCurrentTime();
  } else {
    // Increment fetchedTime by 3 minutes
    fetchedTime = new Date(fetchedTime.getTime() + 3 * 60 * 1000);
  }
}

// Initial fetch of the current time
fetchCurrentTime().then(() => {
  // Set a timer to fetch the time from the API at 12:00 AM
  const remainingTimeUntilMidnight = getRemainingTimeUntilMidnight();
  setTimeout(async () => {
    await fetchCurrentTime();
    console.log('Fetched time at 12:00 AM:', fetchedTime);
  }, remainingTimeUntilMidnight);
});

const serviceManager = {
  convertImageToPng: {
    serviceName: 'convertImageToPng',
    status: true,
    operation: convertImageToPng
  },
  knowledgeRequest: {
    serviceName: 'knowledgeRequest',
    status: true,
    operation: knowledgeRequest
  }
};

async function workerManager(logger) {
  const tasks = await Task.find({
    status: { $nin: [TaskStatusMap.MISSING, TaskStatusMap.DISABLED] }
  });

  if (!tasks.length) return;

  await updateTimeIfNecessary();
  logger.info('current time: ', fetchedTime);

  tasks.forEach(async (task) => {
    const service = serviceManager[task.serviceName];
    if (!service) {
      return logger.error(`Service ${task.serviceName} not available`);
    } else if (service.status === false) {
      return logger.error(`Service ${task.serviceName} disabled`);
    } else {
      if (task.whenToRun === 'Nightly' && !isNightTime()) return;

      const startDate = new Date().toISOString().split('T');
      const logInfo = {
        status: `P-Start (${task.serviceName})`,
        uuid: task._id
      };
      logInfo.input = task.info;
      logInfo.date = startDate[0];
      logInfo.time = startDate[1].split('.')[0];
      if (task.whenToRun === 'Nightly') logInfo.runtime = task.whenToRun;
      logger.info(stringifyError(logInfo));

      const { status, isSuccess } = await service.operation(task, logger);

      const endDate = new Date().toISOString().split('T');
      logInfo.status = `P-End (${task.serviceName})`;
      logInfo.isSuccess = isSuccess;
      logInfo.date = endDate[0];
      logInfo.time = endDate[1].split('.')[0];
      logger.info(stringifyError(logInfo));

      if (isSuccess) {
        await Task.findOneAndDelete({ _id: task._id });
      } else if (status === TaskStatusMap.MISSING) {
        const $set = { status: TaskStatusMap.MISSING };
        await Task.findOneAndUpdate({ _id: task._id }, { $set });
      }
    }
  });
}

async function convertImageToPng({ _id, info: { ref, sampleID } }, logger) {
  logger.info('Worker-services.convertImageToPng - Function entry');
  const pngFilePath = `${ref.split(/.tiff?/)[0]}.png`;
  const pngFile = pngFilePath.split('mm_files/')[1];
  let tempFile = generateTempFileName(ref);

  // TODO: enable in case of repeated server failure
  // const isFileUploaded = await isObjectExistInMinio(bucketName, pngFile);
  // if (isFileUploaded) return { isSuccess: true, status: TaskStatusMap.COMPLETED };

  let tiffImagePath = ref;
  let isFileExist = await checkFileExistence(ref);
  if (!isFileExist) {
    isFileExist = await checkFileExistence(tempFile);
    if (isFileExist) tiffImagePath = tempFile;
  }

  // converts the tiff image to png
  let date = new Date().toISOString().split('T');
  const logInfo = {
    status: 'Worker-services.Image Conversion:: Started',
    input: { ref, sampleID },
    uuid: _id,
    date: date[0],
    time: date[1].split('.')[0]
  };
  logger.info(stringifyError(logInfo));
  if (isFileExist) {
    try {
      await sharp(tiffImagePath).png().toFile(pngFilePath);
      FileManager.deleteFile(ref, { logger });
      const date = new Date().toISOString().split('T');
      logInfo.status = 'Worker-services.Image Conversion:: Completed';
      logInfo.date = date[0];
      logInfo.time = date[1].split('.')[0];
      logger.info(stringifyError(logInfo));
    } catch (error) {
      tempFile = prefixFile(ref);
      logger.error(error);
      return { status: TaskStatusMap.FAILED, isSuccess: false };
    }
  }

  // update the curation in the database
  date = new Date().toISOString().split('T');
  logInfo.status =
    'Worker-services.Update curation with converted file:: Started';
  logInfo.date = date[0];
  logInfo.time = date[1].split('.')[0];
  logger.info(stringifyError(logInfo));

  tempFile = generateTempFileName(pngFile);
  const isPngTempFileExist = await checkFileExistence(tempFile);
  const isPngFileExist =
    (await checkFileExistence(pngFilePath)) || isPngTempFileExist;
  if (isPngFileExist) {
    try {
      const curationObject = await CuratedSamples.findOne({ _id: sampleID });

      if (!curationObject) {
        return { isSuccess: true, status: TaskStatusMap.COMPLETED };
      }
      const ImageFile = curationObject?.object?.MICROSTRUCTURE?.ImageFile;
      curationObject.object.MICROSTRUCTURE.ImageFile = ImageFile.map(
        ({ File, ...rest }) => {
          return File.includes(ref.split('mm_files/')[1])
            ? { File: `/api/files/${pngFile}?isStore=true`, ...rest }
            : { File, ...rest };
        }
      );
      await CuratedSamples.findOneAndUpdate(
        { _id: sampleID },
        {
          $set: {
            object: curationObject.object
          }
        },
        {
          new: true,
          lean: true
        }
      );
      const date = new Date().toISOString().split('T');
      logInfo.status =
        'Worker-services.Update curation with converted file:: Completed';
      logInfo.date = date[0];
      logInfo.time = date[1].split('.')[0];
      logger.info(stringifyError(logInfo));
    } catch (error) {
      logger.error(error);
      prefixFile(pngFilePath);
      return { status: TaskStatusMap.FAILED, isSuccess: false };
    }
  }

  // uploads the converted file to the bucket
  date = new Date().toISOString().split('T');
  logInfo.status =
    'Worker-services.Uploading converted file to object store:: Started';
  logInfo.date = date[0];
  logInfo.time = date[1].split('.')[0];
  logger.info(stringifyError(logInfo));
  try {
    if (!(await isObjectExistInMinio(BUCKETNAME, pngFile)) && !isPngFileExist) {
      return {
        status: TaskStatusMap.MISSING,
        isSuccess: false
      };
    }

    const file = {
      filename: pngFile,
      path: isPngTempFileExist ? tempFile : pngFilePath,
      mimetype: SupportedFileResponseHeaders[`.${pngFile.split('.').pop()}`]
    };

    const metaData = {
      'Content-Type': file.mimetype,
      'X-Amz-Meta-Data': 'MaterialsMine Project'
    };

    await minioClient.fPutObject(
      BUCKETNAME,
      file.filename,
      file.path,
      metaData
    );
    FileManager.deleteFile(file.path, { logger });
    const date = new Date().toISOString().split('T');
    logInfo.status =
      'Worker-services.Uploading converted file to object store:: Completed';
    logInfo.date = date[0];
    logInfo.time = date[1].split('.')[0];
    logger.info(stringifyError(logInfo));
    return { status: TaskStatusMap.COMPLETED, isSuccess: true };
  } catch (error) {
    prefixFile(pngFilePath);
    logger.error(error);
    return { status: TaskStatusMap.FAILED, isSuccess: false };
  }
}

async function knowledgeRequest(
  { _id: uuid, info: { knowledgeId, req } },
  logger
) {
  logger.info('Worker-services.knowledgeRequest - Function entry');
  let date = new Date().toISOString().split('T');
  const logInfo = {
    status: 'Worker-services.knowledgeRequest:: Started',
    input: { query: req?.query, body: req?.body },
    uuid,
    date: date[0],
    time: date[1].split('.')[0]
  };
  logger.info(stringifyError(logInfo));

  // attach request body and query if not set
  if (!req.body) req.body = { query: undefined };
  req.logger = logger;
  req.isBackendCall = true;
  req.knowledgeId = knowledgeId;
  req.env = { KNOWLEDGE_ADDRESS: env.KNOWLEDGE_ADDRESS };
  try {
    const result = await KnowledgeController.getSparql(req, {}, (fn) => fn);

    date = new Date().toISOString().split('T');
    logInfo.status = 'Worker-services.knowledgeRequest:: Completed';
    logInfo.date = date[0];
    logInfo.time = date[1].split('.')[0];
    logger.info(stringifyError(logInfo));

    return result
      ? {
          status: TaskStatusMap.COMPLETED,
          isSuccess: true
        }
      : {
          status: TaskStatusMap.FAILED,
          isSuccess: false
        };
  } catch (error) {
    logger.error(error);
    return { status: TaskStatusMap.FAILED, isSuccess: false };
  }
}

const isObjectExistInMinio = async (bucketName, fileName) => {
  try {
    return !!(await minioClient.statObject(bucketName, fileName))?.size;
  } catch (error) {
    return false;
  }
};

async function checkFileExistence(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

// rename file with prefix for 'failed uploads'
const prefixFile = async (filename, logger) => {
  try {
    const tempFileName = generateTempFileName(filename);

    // rename file or write to the root directory
    fs.copyFileSync(filename, tempFileName);

    FileManager.deleteFile(filename, { logger });
    return tempFileName;
  } catch (error) {
    logger.error(error);
  }
};

const generateTempFileName = (filepath) => {
  const filename = filepath.split('/').pop();
  return `mm_files/failed_upload_${filename}`;
};

module.exports = { convertImageToPng, workerManager, knowledgeRequest };
