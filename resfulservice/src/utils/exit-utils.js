const { log } = require('../middlewares');
const mongoose = require('mongoose');

module.exports = {
  onExit: async (e) => {
    try {
      console.log('tolu:', e);
      console.log('logtolu:', log);
      if (error) {
        log.info('*** Closing Application ***');
        log.error(error);
      }

      await mongoose.disconnect();
      log.info('Disconnected from database');
      process.exit(1);
    } catch (error) {
      log.error(error);
      process.exit(1);
    }
  }
};
