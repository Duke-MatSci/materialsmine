exports.latencyCalculator = (res) => {
  const startTime = res.get('entrytime');
  const endTime1 = new Date().getTime();
  const latency = Math.floor((endTime1 - startTime));
  res.header('endTime', endTime1);
  res.header('latency', `${Math.floor((latency / 1000) % 60)} seconds`);
};
