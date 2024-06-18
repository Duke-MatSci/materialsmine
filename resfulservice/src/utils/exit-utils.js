module.exports = {
  onExit: async (mongoose, log, error = undefined, exitCode = 0) => {
    try {
      if (error) {
        log.info('*** Closing Application ***');
        log.error(error);
      }

      await mongoose.disconnect();
      log.info('Disconnected from database');
      process.exit(exitCode);
    } catch (error) {
      log.error(error);
      process.exit(1);
    }
  }
};
