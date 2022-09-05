const fs = require('fs');

const deleteFile = (path, req) => {
  fs.unlink(path, err => {
    if (err) return err;
    else {
      req.logger?.info('file deleted');
    }
  });
};

module.exports = deleteFile;
