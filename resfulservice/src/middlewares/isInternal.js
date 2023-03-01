const { decodeToken, signToken } = require('../utils/jwtService');
const { errorWriter } = require('../utils/logWriter');

exports.getInternal = (req, res, next) => {
  const isInternal = req.get('Authorization')?.split(' ')[1];
  let decodedToken;
  if (!isInternal) {
    throw errorWriter(req, 'Not authorized.', 'getInternal()', 403);
  }
  try {
    decodedToken = decodeToken(req, isInternal);
  } catch (err) {
    throw errorWriter(req, err, 'getInternal()', 500);
  }
  req.internal = decodedToken;
  next();
};

exports.setInternal = (req, payload) => {
  let signedToken;
  try {
    signedToken = signToken(req, {
      ...payload,
      isInternal: true
    });

    return signedToken;
  } catch (err) {
    throw errorWriter(req, err, 'getInternal()', 500);
  }
};
