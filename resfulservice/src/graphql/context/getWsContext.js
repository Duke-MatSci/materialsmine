const User = require('../../models/user');
const { decodeToken } = require('../../utils/jwtService');

async function getWsContext ({ req, connectionParams }) {
  const token = connectionParams?.accessToken;
  if (token) {
    try {
      const { userId } = decodeToken(req, token);
      const user = await User.findById(userId).lean();
      if (user) return { userId, req, isAuthenticated: true };
    } catch (err) {
      req?.logger?.error(`[getWsContext]: Token decode failed - ${err.message}`);
    }
    return {};
  }
  return {};
}

module.exports = getWsContext;
