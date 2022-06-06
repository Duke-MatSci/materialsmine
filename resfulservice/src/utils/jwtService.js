const jwt = require('jsonwebtoken');

function getTkns (req) {
  return req?.env?.TKNS || 'SeCrEtSDefault';
}

module.exports = {
  signToken: (req, payload) => {
    try {
      const signed = jwt.sign(
        payload,
        getTkns(req),
        { expiresIn: req.timer || '8h' }
      );
      return signed;
    } catch (err) {
      err.statusCode = 500;
      throw err;
    }
  },

  decodeToken: (req, token) => {
    try {
      const verified = jwt.verify(token, getTkns(req));
      return verified;
    } catch (err) {
      err.statusCode = 500;
      throw err;
    }
  }
};
