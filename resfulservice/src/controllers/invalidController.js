const { errorWriter } = require('../utils/logWriter');

exports.notFound = async (req, res, next) => {
  if (req.originalUrl === '/graphql') return next();
  return next(errorWriter(req, 'Contact Administrator', 'notFound', 404));
};
