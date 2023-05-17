const readXlsxFile = require('read-excel-file/node');
const Xmljs = require('xml-js');

exports.xlsxFileReader = async (path, sheetName) => {
  const sheetData = await readXlsxFile(path, { sheet: sheetName });
  return sheetData;
};

exports.xmlGenerator = (curationObject) => {
  return Xmljs.json2xml(curationObject, { compact: true, spaces: 2 });
};
