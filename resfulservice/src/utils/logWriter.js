/**
 * Writes error to logger and return the error
 * @param {*} req
 * @param {*} error
 * @param {String} fnName
 * @param {Number} code
 * @param {String} type
 * @returns {Error} error
 */
exports.errorWriter = (req, error, fnName = 'N/A', code, type) => {
  if (!error) {
    req.logger?.emerg(`[${fnName}]: No error info provided`);
    return new Error('Server Error');
  }

  if (type) req.logger[type](`[${fnName}]: error - ${error}`);
  else req.logger?.error(`[${fnName}]: error - ${error}`);
  const err = new Error(error);
  if (code) err.statusCode = code;
  return err;
};

/**
 * Writes successful executions into logger
 * @param {*} req
 * @param {*} message
 * @param {String} fnName
 * @returns
 */
exports.successWriter = (req, message, fnName) => {
  return req.logger?.notice(`${fnName}(): Success - ${message}`);
};
