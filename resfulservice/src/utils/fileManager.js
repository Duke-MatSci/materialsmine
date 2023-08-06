const fs = require('fs');
const path = require('path');

const deleteFile = (path, req) => {
  fs.unlink(path, err => {
    if (err) return err;
    else {
      req.logger?.info('file deleted');
    }
  });
};

async function selectFile (filesDirectory, filename) {
  const files = await fs.promises.readdir(filesDirectory);

  for (const file of files) {
    const filePath = path.join(filesDirectory, file);
    const stats = await fs.promises.lstat(filePath);

    if (stats.isDirectory()) {
      const foundFile = await selectFile(filePath, filename);
      if (foundFile) return foundFile;
    } else if (file === filename) {
      return file;
    }
  }

  return null;
}

async function findFile (req) {
  if (!req.env?.FILES_DIRECTORY) {
    return null;
  }

  const { fileId } = req.params;
  const foundFile = await selectFile(req.env?.FILES_DIRECTORY, fileId);

  if (!foundFile) {
    return null;
  }

  const filePath = path.join(req.env?.FILES_DIRECTORY, foundFile);

  // Stream the file to the client response
  return fs.createReadStream(filePath);
}

module.exports = { deleteFile, findFile };
