const cluster = require('cluster');
const mongoose = require('mongoose');

async function onExit(rawError, log) {
  const error = rawError ?? {};

  try {
    log.info('*** Closing Application ***');

    if (error.reason) {
      log.error(
        `Unhandled Rejection at:\n${stringifyError(
          error.promise
        )}\nreason:\n${stringifyError(error.reason)}`
      );
    } else if (error.signal) {
      log.error(`Received ${error.signal}, shutting down.`);
    } else if (Object.keys(error).length) {
      log.error(stringifyError(error));
    } else {
      log.error(error);
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      log.info('Disconnected from database');
    }
  } catch (disconnectError) {
    log.error(stringifyError(disconnectError));
  } finally {
    if (cluster.isMaster) {
      cluster.disconnect();
    }

    setTimeout(() => {
      log.error('Forcefully shutting down');
      process.exit(1);
    }, 5000).unref();

    process.exit(1);
  }
}

function stringifyError(obj) {
  try {
    return JSON.stringify(
      obj,
      (_key, value) => {
        if (value instanceof Error) {
          return {
            message: value.message,
            stack: value.stack,
            ...value
          };
        }
        return value;
      },
      2
    );
  } catch (error) {
    return String(obj);
  }
}

module.exports = { onExit, stringifyError };
