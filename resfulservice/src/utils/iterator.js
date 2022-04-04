/**
 * Iterator that runs a given method for each iteration
 * @param {*} arr
 * @param {Function} iterationFn
 * @param {Number} batchSize
 * @returns {Promise}
 */
module.exports = (arr, iterationFn, batchSize) => new Promise((resolve, reject) => {
  let pendingPromises = [];
  const pausePromises = async () => {
    try {
      // eslint-disable-next-line no-extra-boolean-cast
      if (!!pendingPromises.length) {
        await Promise.all(pendingPromises);
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  };
  const arrStream = arr.stream();
  arrStream.on('data', async data => {
    pendingPromises.push(iterationFn(data));
    if (batchSize && pendingPromises.length >= batchSize) {
      arrStream.pause();
      await Promise.all(pendingPromises);
      pendingPromises = [];
      arrStream.resume();
    }
  });
  arrStream.on('error', error => {
    reject(error);
  });
  arrStream.on('end', () => {
    pausePromises();
  });
});
