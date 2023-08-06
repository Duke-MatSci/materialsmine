const fs = require('fs');
const readXlsxFile = require('read-excel-file/node');
const decompress = require('decompress');
const path = require('path');
const Xmljs = require('xml-js');
const csv = require('csv-parser');
const { deleteFile, deleteFolder } = require('../utils/fileManager');

exports.xlsxFileReader = async (path, sheetName) => {
  const sheetData = await readXlsxFile(path, { sheet: sheetName });
  return sheetData;
};

exports.xmlGenerator = (curationObject) => {
  return Xmljs.json2xml(curationObject, { compact: true, spaces: 2, ignoreDeclaration: false, textFn: fixUrl });
};

exports.jsonGenerator = (xml) => {
  return Xmljs.xml2json(xml, { compact: true, spaces: 2 });
};

exports.parseCSV = async (filename) => {
  return new Promise((resolve, reject) => {
    const jsonData = [];
    fs.createReadStream(filename)
      .pipe(csv())
      .on('data', (data) => jsonData.push(data))
      .on('end', () => {
        resolve(jsonData);
      })
      .on('error', reject);
  });
};

exports.unZipFolder = async (req, filename) => {
  const logger = req.logger;
  try {
    const folderPath = `mm_files/bulk-curation-${new Date().getTime()}`;
    const allfiles = await decompress(filename, folderPath);

    deleteFile(filename, req);
    deleteFolder(`${folderPath}/__MACOSX`, req);
    return { folderPath, allfiles };
  } catch (error) {
    logger.error(`[unZipFolder]: ${error}`);
    error.statusCode = 500;
    throw error;
  }
};

exports.readFolder = (folderPath) => {
  const folderContent = fs.readdirSync(folderPath)
    .map(fileName => {
      return path.join(folderPath, fileName);
    });

  const isFolder = fileName => {
    return (fs.lstatSync(fileName).isDirectory() && fileName.split('/').pop() !== '__MACOSX');
  };

  const isFile = fileName => {
    return fs.lstatSync(fileName).isFile();
  };

  const folders = folderContent.filter(isFolder);
  const files = folderContent.filter(isFile);

  const regex = /(?=.*?(master_template))(?=.*?(.xlsx)$)/gi;
  const masterTemplates = [];
  const curationFiles = [];
  files.forEach((file) => {
    if (regex.test(file)) {
      masterTemplates.push(file);
    } else {
      curationFiles.push(file);
    }
  });

  return { folders, files, masterTemplates, curationFiles };
};

const fixUrl = function (val, elementName) {
  return elementName === 'URL' ? val.replace(/&amp;/gi, '&') : val;
};
