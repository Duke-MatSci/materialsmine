const User = require('../../models/user');
const { decodeToken } = require('../../utils/jwtService');

async function getHttpContext ({ req }) {
  const logger = req.logger;
  if (!req.headers.authorization) {
    logger.warning('[getHttpContext]: No header authorization key provided');
    return { undefined, req };
  }
  logger.info('[getHttpContext]: Setting up req http ctx');
  try {
    const { email } = decodeToken(req, req.headers.authorization);
    const user = await User.findOne({ email }).lean();
    if (user) return { user, req, isAuthenticated: true };
  } catch (err) {
    logger.error(`[getHttpContext]: Token decode failed - ${err.message}`);
    return { req, isAuthenticated: false };
  }
}

module.exports = getHttpContext;
