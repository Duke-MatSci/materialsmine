const { decodeToken, signToken } = require('../utils/jwtService');

exports.getInternal = (req, res, next) => {
  const log = req.logger;
  const isInternal = req?.isInternal;
  let decodedToken;
  if (!isInternal) {
    log.error('getInternal(): 403 - isInternal not provided. Not authorized');
    const error = new Error('Not authorized.');
    error.statusCode = 403;
    throw error;
  }
  try {
    decodedToken = decodeToken(req, isInternal);
  } catch (err) {
    log.error(`getInternal(): 500 - ${err}`);
    err.statusCode = 500;
    throw err;
  }
  req.internal = decodedToken?.isInternal;
  next();
};

exports.setInternal = (req, res, next) => {
  const log = req.logger;
  let signedToken
  try {
    signedToken = signToken(req, {
      isInternal: true
    });
  } catch (err) {
    log.error(`getInternal(): 500 - ${err}`);
    err.statusCode = 500;
    throw err;
  }
  req.signedToken = signedToken;
  next();
}