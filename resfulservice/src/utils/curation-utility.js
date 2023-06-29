const fs = require('fs');
const readXlsxFile = require('read-excel-file/node');
const decompress = require('decompress');
const path = require('path');
const Xmljs = require('xml-js');
const csv = require('csv-parser');

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
    await decompress(filename, folderPath);

    const { files, folders } = this.readFolder(folderPath);

    return { folderPath, files, folders };
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
    return fs.lstatSync(fileName).isDirectory();
  };

  const isFile = fileName => {
    return fs.lstatSync(fileName).isFile();
  };

  const folders = folderContent.filter(isFolder);
  const files = folderContent.filter(isFile);
  return { folders, files };
};

const fixUrl = function (val, elementName) {
  return elementName === 'URL' ? val.replace(/&amp;/gi, '&') : val;
};
