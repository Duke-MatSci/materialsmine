const { decodeToken } = require('../utils/jwtService');

module.exports = (req, res, next) => {
  const log = req.logger;
  const authHeader = req?.headers?.authorization;
  if (!authHeader) {
    log.error('isAuth.js(): 401 - authHeader not provided');
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader?.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = decodeToken(req, token);
  } catch (err) {
    log.error(`isAuth.js(): 500 - ${err}`);
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    log.error('isAuth.js(): 401 - decodedToken not found after jwt decode');
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }

  req.userId = decodedToken.userId;
  req.user = decodedToken;
  next();
};
