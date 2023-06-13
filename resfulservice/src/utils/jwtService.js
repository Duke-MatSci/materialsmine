const jwt = require('jsonwebtoken');

function getTkns (req) {
  return req?.env?.TKNS || 'SeCrEtSDefault';
}

module.exports = {
  signToken: (req, payload) => {
    const logger = req.logger;
    try {
      const signed = jwt.sign(payload, getTkns(req), { expiresIn: req.timer ?? '8h' });
      return signed;
    } catch (err) {
      logger.error(`[signToken]: Failed to sign - ${err}`);
      err.statusCode = 500;
      throw err;
    }
  },

  decodeToken: (req, token) => {
    const logger = req.logger;
    try {
      const verified = jwt.verify(token, getTkns(req));
      return verified;
    } catch (err) {
      logger.error(`[decodeToken]: ${err}`);
      err.statusCode = 500;
      throw err;
    }
  }
};
