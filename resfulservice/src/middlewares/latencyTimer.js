module.exports = (req, res, next) => {
  res.header('entryTime', new Date().getTime());
  next();
};
