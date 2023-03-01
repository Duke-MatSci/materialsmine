module.exports = (req, res, next) => {
  const env = process.env;
  req.env = env;
  next();
};
