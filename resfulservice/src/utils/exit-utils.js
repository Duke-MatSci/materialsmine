const mongoose = require('mongoose');

module.exports = {
  onExit: async (error, log) => {
    try {
      if (error.reason) {
        log.info('*** Closing Application ***');
        log.error(
          `Unhandled Rejection at:
          ${stringifyError(error.promise)},
          reason:
          ${stringifyError(error.reason)}`
        );
      } else {
        log.info('*** Closing Application ***');
        log.error(stringifyError(error));
      }

      // Disconnect from database
      await mongoose.disconnect();
      log.info('Disconnected from database');

      // Forcefully shut down after 5 seconds
      return setTimeout(() => {
        log.error('Forcefully shutting down');
        process.exit(1);
      }, 5000);
    } catch (error) {
      log.error(stringifyError(error));
      process.exit(1);
    }
  },
  stringifyError
};

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
