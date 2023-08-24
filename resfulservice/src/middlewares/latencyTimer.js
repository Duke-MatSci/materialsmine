exports.latencyTimer = (req, res, next) => {
  res.header('entryTime', new Date().getTime());
  next();
};

exports.latencyCalculator = (res) => {
  const startTime = res.get('entrytime');
  const endTime = new Date().getTime();
  const latency = Math.floor((endTime - startTime));
  res.header('endTime', new Date(endTime));
  res.header('latency', `${Math.floor((latency / 1000) % 60)} seconds`);
};
