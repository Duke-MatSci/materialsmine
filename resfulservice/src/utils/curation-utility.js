const readXlsxFile = require('read-excel-file/node');
const Xmljs = require('xml-js');
const fs = require('fs');
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

const fixUrl = function (val, elementName) {
  return elementName === 'URL' ? val.replace(/&amp;/gi, '&') : val;
};
