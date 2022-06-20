const User = require('../../models/user');
const { decodeToken } = require('../../utils/jwtService');

async function getHttpContext ({ req }) {
  const logger = req.logger;
  if (!req.headers.authorization) {
    logger.warning('[getHttpContext]: No header authorization key provided');
    return { undefined, req };
  }
  logger.info('[getHttpContext]: Setting up req http ctx');
  const { email } = decodeToken(req, req.headers.authorization);
  const user = await User.findOne({ email }).lean();
  if (user) return { user, req, isAuthenticated: true };
}

module.exports = getHttpContext;
