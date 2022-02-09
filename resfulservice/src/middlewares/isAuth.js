const { decodeToken } = require('../utils/jwtService');

module.exports = (req, res, next) => {
  const authHeader = req?.Authorization;
  if (!authHeader) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader?.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = decodeToken(req, token);
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }

  req.userId = decodedToken.userId;
  next();
};
