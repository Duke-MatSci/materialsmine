const User = require('../../models/user');
const { decodeToken } = require('../../utils/jwtService');

async function getHttpContext ({ req }) {
  if (!req.headers.authorization) return;

  const { userId } = decodeToken(req, req.headers.authorization);
  const user = await User.findById(userId).lean();
  if (user) { return { user, req, isAuthenticated: true }; }
}

module.exports = getHttpContext;
