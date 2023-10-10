const fs = require('fs');
const path = require('path');

const deleteFile = (path, req) => {
  fs.unlink(path, (err) => {
    if (err) return err;
    else {
      req.logger?.info('file deleted');
    }
  });
};

const deleteFolder = async (folderPath, req) => {
  fs.rm(folderPath, { recursive: true, force: true }, (err) => {
    if (err) {
      return err;
    } else {
      req.logger?.info('Directory deleted successfully');
    }
  });
};

const getDirectoryFiles = (filesDirectory, filename) => {
  let filesDirectoryValue = filesDirectory;
  let parsedFileName = filename;
  // Split the path by "/"
  const pathArray = filename.split('/');

  if (pathArray.length) {
    parsedFileName = pathArray[pathArray.length - 1];
    pathArray.pop();
    filesDirectoryValue = path.join(filesDirectory, pathArray.join('/'));
  }

  return { filesDirectoryValue, parsedFileName };
};

async function selectFile (filesDirectory, filename) {
  const files = await fs.promises.readdir(filesDirectory);

  for (const file of files) {
    const filePath = path.join(filesDirectory, file);
    const stats = await fs.promises.lstat(filePath);

    if (file === filename) {
      return file;
    } else if (stats.isDirectory()) {
      const foundFile = await selectFile(filePath, filename);
      if (foundFile) return foundFile;
    }
  }

  return null;
}

function getFileExtension (file) {
  return path.parse(file);
}

async function findFile (req) {
  const { fileId } = req.params;

  if (!req.env?.FILES_DIRECTORY || !fileId) {
    throw new Error('Internal Server Error');
  }

  const { filesDirectoryValue, parsedFileName } = getDirectoryFiles(
    req.env?.FILES_DIRECTORY,
    fileId
  );

  const foundFile = await selectFile(filesDirectoryValue, parsedFileName);

  if (!foundFile) {
    throw new Error('File not found');
  }

  const filePath = path.join(filesDirectoryValue, parsedFileName);
  const { ext } = getFileExtension(foundFile);

  // Stream the file to the client response and send file extension
  return { fileStream: fs.createReadStream(filePath), ext };
}

module.exports = { deleteFile, findFile, deleteFolder, getFileExtension };
