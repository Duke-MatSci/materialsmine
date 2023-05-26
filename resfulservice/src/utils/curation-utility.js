const readXlsxFile = require('read-excel-file/node');
const Xmljs = require('xml-js');
const csv = require('csvtojson');

exports.xlsxFileReader = async (path, sheetName) => {
  const sheetData = await readXlsxFile(path, { sheet: sheetName });
  return sheetData;
};

exports.xmlGenerator = (curationObject) => {
  return Xmljs.json2xml(curationObject, { compact: true, spaces: 2 });
};

exports.parseCSV = async (filename) => {
  const parsedData = await csv().fromFile(filename);
  return parsedData;
};
