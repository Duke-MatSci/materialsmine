const readXlsxFile = require('read-excel-file/node');

exports.xlsxFileReader = async (path, sheetName) => {
  const sheetData = await readXlsxFile(path, { sheet: sheetName });
  return sheetData;
};
