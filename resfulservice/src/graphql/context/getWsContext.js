const User = require('../../models/user');
const { decodeToken } = require('../../utils/jwtService');

async function getWsContext ({ req, connectionParams }) {
  const token = connectionParams?.accessToken;
  if (token) {
    const { userId } = decodeToken(req, token);
    const user = await User.findById(userId).lean();
    if (user) return { userId, req, isAuthenticated: true };
    return {};
  }
  return {};
}

module.exports = getWsContext;
