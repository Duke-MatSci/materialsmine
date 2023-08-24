const fs = require('fs');
const readline = require('readline');
const readXlsxFile = require('read-excel-file/node');
const decompress = require('decompress');
const path = require('path');
const Xmljs = require('xml-js');
const GenerateSchema = require('generate-schema');
const { jsonSchema2xsd } = require('xsdlibrary');
const csv = require('csv-parser');
const { deleteFile, deleteFolder } = require('../utils/fileManager');

exports.xlsxFileReader = async (path, sheetName) => {
  const sheetData = await readXlsxFile(path, { sheet: sheetName });
  return sheetData;
};

exports.xmlGenerator = (curationObject) => {
  return Xmljs.json2xml(curationObject, { compact: true, spaces: 2, ignoreDeclaration: false });
};

exports.jsonGenerator = (xml) => {
  return Xmljs.xml2json(xml, { compact: true, spaces: 2 });
};

exports.jsonSchemaGenerator = (jsonOBject) => {
  return GenerateSchema.json(jsonOBject);
};

exports.jsonSchemaToXsdGenerator = (jsonSchema) => {
  return jsonSchema2xsd(jsonSchema);
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

exports.parseXSDFile = async (req, filename) => {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filename, 'utf-8');
    const parsedfilePath = path.join(req.env?.FILES_DIRECTORY, 'curation.xsd');
    const writeStream = fs.createWriteStream(parsedfilePath);

    const lineReader = readline.createInterface({ input: readStream });

    lineReader.on('line', function (line) {
      const removeLine = '<xs:attribute';
      if (!new RegExp(removeLine, 'gm').test(line)) {
        const regex = /<xs:element/gm;
        const root = /name="PolymerNanocomposite"/gm;
        const chooseParameter = /name="ChooseParameter"/gm;
        const maxOccurs = 'maxOccurs="unbounded"';

        if (chooseParameter.test(line) && !new RegExp(maxOccurs, 'gm').test(line)) {
          const lineArray = line.split('<xs:element');
          const modifiedLine = [lineArray[0], '<xs:element ', 'minOccurs="0"', ' ', maxOccurs, lineArray[1]].join('');
          writeStream.write(`${modifiedLine}\r\n`);
        } else if (regex.test(line) && !root.test(line)) {
          const lineArray = line.split('<xs:element');
          const modifiedLine = [lineArray[0], '<xs:element ', 'minOccurs="0"', lineArray[1]].join('');
          writeStream.write(`${modifiedLine}\r\n`);
        } else {
          writeStream.write(`${line}\r\n`);
        }
      }
    });

    lineReader.on('close', async () => {
      writeStream.end();
      writeStream.on('finish', () => {
        resolve(parsedfilePath);
      });
    });
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
