const mongoose = require('mongoose');

module.exports = {
  onExit: async (error, log) => {
    try {
      if (error.reason) {
        log.info('*** Closing Application ***');
        log.error(
          'Unhandled Rejection at:',
          error.promise,
          'reason:',
          error.reason
        );
      } else {
        log.info('*** Closing Application ***');
        log.error(error);
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
      log.error(error);
      process.exit(1);
    }
  }
};
