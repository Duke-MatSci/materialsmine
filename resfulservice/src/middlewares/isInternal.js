const { decodeToken, signToken } = require('../utils/jwtService');

exports.getInternal = (req, res, next) => {
  console.log('truli!');
  const log = req.logger;
  const isInternal = req.get('Authorization')?.split(' ')[1];
  let decodedToken;
  console.log('truli1!', isInternal);
  if (!isInternal) {
    log.error('getInternal(): 403 - isInternal not provided. Not authorized');
    const error = new Error('Not authorized.');
    error.statusCode = 403;
    throw error;
  }
  try {
    decodedToken = decodeToken(req, isInternal);
  } catch (err) {
    console.log('truli2!');
    log.error(`getInternal(): 500 - ${err}`);
    err.statusCode = 500;
    throw err;
  }
  console.log('truli3!', decodedToken);
  req.internal = decodedToken;
  next();
};

exports.setInternal = (req, res, next) => {
  const log = req.logger;
  let signedToken;
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
};
