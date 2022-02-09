module.exports = (req, res, next) => {
  const env = process.env;
  req.env = { TKNS: env?.TKNS };
  next();
};
