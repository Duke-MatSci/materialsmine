/* eslint-disable space-before-function-paren */
// https://github.com/prettier/prettier/issues/3847
/* eslint-disable indent */
const util = require('util');
const fs = require('fs');
const XlsxFileManager = require('../utils/curation-utility');
const FileManager = require('../utils/fileManager');
const BaseSchemaObject = require('../../config/xlsx.json');
const { errorWriter, successWriter } = require('../utils/logWriter');
const latency = require('../middlewares/latencyTimer');
const {
  BaseObjectSubstitutionMap,
  CurationEntityStateDefault,
  XSDJsonPlaceholder,
  userRoles,
  SupportedFileResponseHeaders,
  CurationStateSubstitutionMap,
  CurationStateDefault
} = require('../../config/constant');
const CuratedSamples = require('../models/curatedSamples');
const XlsxCurationList = require('../models/xlsxCurationList');
const XmlData = require('../models/xmlData');
const DatasetId = require('../models/datasetId');
const FsFile = require('../models/fsFiles');
const Task = require('../sw/models/task');
const ChangeLog = require('../models/changeLog');
const FileStorage = require('../middlewares/fileStorage');
const FileController = require('./fileController');

exports.curateXlsxSpreadsheet = async (req, res, next) => {
  const { user, logger, query } = req;
  logger.info('curateXlsxSpreadsheet Function Entry:');

  try {
    const storedCurations = await CuratedSamples.find(
      { user: user._id },
      { object: 1 },
      { lean: true }
    );

    let result;
    const processedFiles = { toBeUploaded: [], toBeDeleted: [] };

    const regex = /(?=.*?(master_template))(?=.*?(.xlsx)$)/gi;
    const xlsxFile = req.files?.uploadfile.find((file) =>
      regex.test(file?.path)
    );

    const errorMessage = validateCurationPayload(req, xlsxFile);
    if (errorMessage) {
      return next(errorWriter(req, errorMessage, 'curateXlsxSpreadsheet', 400));
    }

    if (query?.isBaseObject) {
      const curationObject = req.body.curatedjsonObject;
      const uniqueFields = getCurationUniqueFields(curationObject);
      const publicationType = uniqueFields.publicationType ?? undefined;
      const title = uniqueFields.title ?? undefined;

      const curatedAlready = findDuplicate(
        storedCurations,
        title,
        publicationType
      );
      if (curatedAlready) {
        return next(
          errorWriter(
            req,
            'This had been curated already',
            'curateXlsxSpreadsheet',
            409
          )
        );
      }
      const { filteredObject, errors } = await createJsonObject(
        curationObject,
        [],
        undefined,
        processedFiles
      );

      if (Object.keys(errors)?.length) {
        return res.status(400).json({ fieldError: errors });
      }

      result = filterNestedObject(filteredObject);
    } else {
      const sheetsData = {};
      const {
        title: titleCellLocation,
        publicationType: publicationTypeCellLocation
      } = getCurationUniqueFields(BaseSchemaObject);
      const [sheetName, titleRow, titleCol] = titleCellLocation
        .replace(/[[\]]/g, '')
        .split(/\||,/);

      const [, pubRow, pubCol] = publicationTypeCellLocation
        .replace(/[[\]]/g, '')
        .split(/\||,/);

      sheetsData[sheetName] = await XlsxFileManager.xlsxFileReader(
        xlsxFile.path,
        sheetName
      );

      const title =
        sheetsData[sheetName]?.[+titleRow]?.[+titleCol] ?? undefined;
      const publicationType =
        sheetsData[sheetName]?.[+pubRow]?.[+pubCol] ?? undefined;
      const curatedAlready = findDuplicate(
        storedCurations,
        title,
        publicationType
      );
      if (curatedAlready) {
        return next(
          errorWriter(
            req,
            'This had been curated already',
            'curateXlsxSpreadsheet',
            409
          )
        );
      }
      const validList = await XlsxCurationList.find({}, null, { lean: true });
      const validListMap = generateCurationListMap(validList);
      result = await this.createMaterialObject(
        xlsxFile.path,
        BaseSchemaObject,
        validListMap,
        req.files.uploadfile,
        processedFiles,
        sheetsData,
        logger,
        req?.isParentFunction
      );

      if (result?.errorCount && req?.isParentFunction) {
        return { errors: result.errors };
      }

      if (result?.errorCount) {
        return res.status(400).json({
          filename: `/api/files/${xlsxFile.filename}?isFileStore=true`,
          errors: result.errors
        });
      }
    }
    const requiredFields = getCurationUniqueFields(result);
    result.Control_ID = await generateControlId(
      requiredFields,
      user,
      query?.dataset
    );

    let datasets;
    if (query.dataset) {
      datasets = await DatasetId.findOne({ _id: query.dataset });
    } else {
      datasets = await DatasetId.create({ user });
    }

    if (!datasets) {
      return next(
        errorWriter(
          req,
          `A sample must belong to a dataset. Dataset ID: ${
            query.dataset ?? null
          } not found`,
          'curateXlsxSpreadsheet',
          404
        )
      );
    }

    const newCurationObject = new CuratedSamples({
      object: result,
      user: user?._id,
      dataset: datasets._id
    });
    newCurationObject.object.ID = newCurationObject._id;
    if (processedFiles.toBeUploaded.length) {
      processedFiles.toBeUploaded.forEach(async ({ path }) => {
        const isTif = XlsxFileManager.isTifFile(path);
        if (isTif) {
          await Task.create({
            serviceName: 'convertImageToPng',
            info: {
              ref: path,
              sampleID: newCurationObject._id.toString()
            }
          });
        }
      });
    }
    const curatedObject = await (
      await newCurationObject.save()
    ).populate('user', 'displayName');

    await datasets.updateOne({ $push: { samples: curatedObject } });

    const generatedXml = XlsxFileManager.xmlGenerator(
      JSON.stringify({ PolymerNanocomposite: curatedObject.object })
    );

    const xml = `<?xml version="1.0" encoding="utf-8"?>\n  ${generatedXml}`;
    const curatedSample = {
      sampleID: curatedObject._id,
      xml,
      user: curatedObject.user,
      groupId: curatedObject.dataset,
      isApproved: curatedObject.entityState !== CurationEntityStateDefault,
      status: curatedObject.curationState
    };

    if (req?.isParentFunction) return { curatedSample, processedFiles };

    if (!query?.isBaseObject) {
      processedFiles.toBeDeleted.push({
        params: {
          fileId: xlsxFile.filename
        },
        isInternal: true
      });
    }

    processedFiles.toBeDeleted.forEach(
      async (newReq) => await FileController.deleteFile(newReq, {}, (fn) => fn)
    );

    if (query?.isBaseObject && processedFiles.toBeUploaded.length) {
      for (const file of processedFiles.toBeUploaded) {
        const isTif = XlsxFileManager.isTifFile(file.path);
        if (!isTif) {
          FileStorage.minioPutObject(file, req);
        }
      }
    }

    latency.latencyCalculator(res);
    return res.status(201).json({ ...curatedSample });
  } catch (err) {
    next(errorWriter(req, err, 'curateXlsxSpreadsheet', 500));
  }
};

const findDuplicate = (storedCurations, title, publicationType) => {
  const curatedAlready = storedCurations.find(
    ({ object }) =>
      object?.DATA_SOURCE?.Citation?.CommonFields?.Title === title &&
      object?.DATA_SOURCE?.Citation?.CommonFields?.PublicationType ===
        publicationType
  );
  return curatedAlready;
};

const validateCurationPayload = (req, xlsxFile) => {
  const { query } = req;
  let errorMessage;
  if (query?.isBaseObject) {
    if (!req.body?.curatedjsonObject) {
      errorMessage = 'Base Schema curation object not sent';
    }
  } else {
    if (!xlsxFile) {
      errorMessage = 'Master template xlsx file not uploaded';
    }
  }
  return errorMessage;
};

const getCurationUniqueFields = (BaseSchemaObject) => {
  const controlID = BaseSchemaObject?.Control_ID;
  const title =
    BaseSchemaObject?.['DATA ORIGIN']?.Citation?.CommonFields?.Title?.cellValue;
  const publicationType =
    BaseSchemaObject?.['DATA ORIGIN']?.Citation?.CommonFields?.PublicationType
      ?.cellValue;
  const author = BaseSchemaObject?.DATA_SOURCE?.Citation?.CommonFields?.Author;
  const citationType =
    BaseSchemaObject?.DATA_SOURCE?.Citation?.CommonFields?.CitationType;
  const publicationYear =
    BaseSchemaObject?.DATA_SOURCE?.Citation?.CommonFields?.PublicationYear;
  return {
    title,
    publicationType,
    author,
    citationType,
    publicationYear,
    controlID
  };
};

// const generateControlSampleId = async (requiredFields, user, datasetId) => {
//   try {
//     let [existingDatasets, userDatasets] = await Promise.all([
//       DatasetId.find({ user: user._id }),
//       DatasetId.findOne({
//         user: user._id,
//         _id: datasetId
//       })
//     ]);

//     if (!userDatasets && !existingDatasets?.length) {
//       userDatasets = await DatasetId.create({ user });
//     } else {
//       userDatasets = !userDatasets ? existingDatasets.at(-1) : userDatasets;
//     }

//     let { citationType, publicationYear, author } = requiredFields;

//     // L325_S1_Test_2015
//     citationType = citationType === 'lab-generated' ? 'E' : 'L';
//     publicationYear = publicationYear ?? new Date().getFullYear();
//     author = author?.length ? author[0].split(/[,\s]+/)[0] : 'unknown';
//     const sampleIndex = userDatasets?.samples?.length + 1;
//     const datasetIndex = existingDatasets?.length + 1;

//     return `${citationType}${sampleIndex}_S${datasetIndex}_${author}_${publicationYear}.xml`;
//   } catch (error) {
//     const err = new Error(error);
//     err.functionName = 'generateControlSampleId';
//     throw err;
//   }
// };

async function generateControlId(requiredFields, user, datasetId) {
  try {
    // Find or create userDataset from MongoDB
    let userDataset = await DatasetId.findOne({
      user: user._id,
      _id: datasetId
    });

    if (!userDataset) {
      // If userDataset does not exist, create one
      userDataset = await DatasetId.create({ user });
    }

    let { citationType, publicationYear, author } = requiredFields;

    // Determine citationPrefix
    const citationPrefix = citationType === 'lab-generated' ? 'E' : 'L';

    // Determine publicationYear
    publicationYear = publicationYear ?? new Date().getFullYear();

    // Determine author
    const authorName = author?.length
      ? author[0].split(/[,\s]+/)[0]
      : 'unknown';

    // Find curations for datasetIndex
    const regex = new RegExp(
      `^${citationPrefix}\\d*_S\\d*_${authorName}_${publicationYear}`,
      'i'
    );
    // const regex = new RegExp(`^${citationPrefix}.*${authorName}.*\\.xml?$`, 'i');
    let curations = await CuratedSamples.find({
      user: user._id,
      'object.Control_ID': { $regex: regex }
    });

    // Determine datasetIndex
    let datasetIndex, sampleIndex;
    if (curations.length === 0) {
      curations = await CuratedSamples.find({ user: user._id });
      if (curations.length) {
        let highestIndex = 0;
        curations.forEach((curation) => {
          if (curation.object.Control_ID.startsWith(citationPrefix)) {
            const match = curation.object.Control_ID.match(/\d+/);
            if (match) {
              const num = parseInt(match[0], 10);
              if (num > highestIndex) {
                highestIndex = num;
              }
            }
          }
        });
        datasetIndex = highestIndex + 1;
        sampleIndex = 1;
      } else {
        datasetIndex = 1;
        sampleIndex = 1;
      }
    } else {
      const match = curations[0].object.Control_ID.match(/\d+/);
      datasetIndex = match ? parseInt(match[0], 10) : 1;
      sampleIndex = curations.length + 1;
    }

    // Construct controlId & return
    return `${citationPrefix}${datasetIndex}_S${sampleIndex}_${authorName}_${publicationYear}.xml`;
  } catch (error) {
    const err = new Error(error);
    err.functionName = 'generateControlId';
    throw err;
  }
}

const generateDuplicateControlID = async (currentValue, isNew) => {
  const currentNumber = parseInt(currentValue.match(/_S(\d+)_/)[1]);

  // Replace the numeric part after 'S' with the incremented value
  const nextValue = currentValue.replace(
    /(_S)(\d+)(_)/,
    (_, prefix, num) => `${prefix}${currentNumber + 1}_`
  );

  // Check if the next value already exists in the database
  let existingRecord;
  if (isNew === 'true') {
    existingRecord = await CuratedSamples.findOne({
      'object.Control_ID': nextValue
    });
  } else {
    existingRecord = await XmlData.findOne({ title: `${nextValue}.xml` });
  }

  // If the next value exists, recursively call the function with the incremented number
  if (existingRecord) {
    return await generateDuplicateControlID(
      currentValue.replace(/_S(\d+)_/, `_S${currentNumber + 1}_`),
      isNew
    );
  }

  // If the next value does not exist, return it
  return nextValue;
};

exports.getControlSampleId = async (req, res, next) => {
  const { user, logger, body } = req;
  try {
    logger.info('getControlSampleId Function Entry:');

    const controlID = await generateControlId(body, user, body?.datasetId);

    latency.latencyCalculator(res);
    return res.status(201).json({ controlID });
  } catch (error) {
    next(errorWriter(req, error, 'getControlSampleId', 500));
  }
};

exports.bulkXlsxCurations = async (req, res, next) => {
  const { query, logger } = req;

  logger.info('bulkXlsxCurations Function Entry:');

  const regex = /.zip$/gi;
  const zipFile = req.files?.uploadfile?.find((file) => regex.test(file?.path));

  if (!zipFile) {
    return next(
      errorWriter(
        req,
        'bulk curation zip file not uploaded',
        'bulkXlsxCurations',
        400
      )
    );
  }

  if (query.dataset) {
    const dataset = await DatasetId.findOne({ _id: query.dataset });
    if (!dataset) {
      return next(
        errorWriter(
          req,
          `Dataset ID: ${query.dataset ?? null} not found`,
          'bulkXlsxCurations',
          404
        )
      );
    }
  }
  const bulkErrors = [];
  const bulkCurations = [];
  try {
    const { folderPath, allfiles } = await XlsxFileManager.unZipFolder(
      req,
      zipFile.path
    );
    await processFolders(bulkCurations, bulkErrors, folderPath, req);
    if (bulkErrors.length) {
      const failedCuration = bulkErrors.map(
        (curation) => `mm_files/${curation.filename}`
      );
      for (const file of allfiles) {
        const filePath = `${folderPath}/${file?.path}`;
        const isTif = XlsxFileManager.isTifFile(file.path);
        if (
          file.type === 'file' &&
          !failedCuration.includes(filePath) &&
          !isTif
        ) {
          FileManager.deleteFile(filePath, req);
        }
      }
    } else {
      FileManager.deleteFolder(folderPath, req);
    }
    latency.latencyCalculator(res);
    const bulkErrorsArray = bulkErrors.map((curation) => ({
      ...curation,
      filename: `/api/files/${curation.filename}?isFileStore=true`
    }));
    return res.status(200).json({ bulkCurations, bulkErrors: bulkErrorsArray });
  } catch (err) {
    next(errorWriter(req, err, 'bulkXlsxCurations', 500));
  }
};

const processFolders = async (bulkCurations, bulkErrors, folder, req) => {
  const { folders, masterTemplates, curationFiles } =
    XlsxFileManager.readFolder(folder, req.logger);
  await processSingleCuration(
    masterTemplates,
    curationFiles,
    bulkCurations,
    bulkErrors,
    req
  );

  if (folders.length) {
    for (const folder of folders) {
      await processFolders(bulkCurations, bulkErrors, folder, req);
    }
  }
};

const processSingleCuration = async (
  masterTemplates,
  curationFiles,
  bulkCurations,
  bulkErrors,
  req
) => {
  let toBeUploaded = [];
  if (masterTemplates.length) {
    for (const masterTemplate of masterTemplates) {
      const newCurationFiles = [...curationFiles, masterTemplate];
      const newReq = {
        ...req,
        files: {
          uploadfile: newCurationFiles.map((file) => ({
            path: file,
            mimetype: SupportedFileResponseHeaders[`.${file.split('.').pop()}`]
          }))
        },
        isParentFunction: true
      };
      const nextFnCallBack = (fn) => fn;
      const result = await this.curateXlsxSpreadsheet(
        newReq,
        {},
        nextFnCallBack
      );

      if (result?.message || result?.errors) {
        bulkErrors.push({
          filename: masterTemplate.split('mm_files/').pop(),
          errors: result?.message ?? result?.errors
        });
      } else {
        bulkCurations.push(result.curatedSample);
        toBeUploaded = result?.processedFiles?.toBeUploaded;
      }
    }
  }

  // TODO (@tee*): Refactor to remove this and upload inside the closure function e.g. createMaterialObject
  if (toBeUploaded.length) {
    for (const file of toBeUploaded) {
      const isTif = XlsxFileManager.isTifFile(file.path);
      if (!isTif) {
        FileStorage.minioPutObject(file, req);
      }
    }
  }
};

exports.getXlsxCurations = async (req, res, next) => {
  const { user, logger, query, params } = req;

  logger.info('getXlsxCurations Function Entry:');

  const { curationId } = params;
  const { isNew, sheetName } = query;
  const userFilter =
    isNew === 'true' ? { user: user._id } : { iduser: user._id };
  const filter = user?.roles !== userRoles.isAdmin ? userFilter : {};
  try {
    let fetchedObject;
    if (isNew === 'true') {
      const xlsxObject = await CuratedSamples.findOne(
        { _id: curationId, ...filter },
        null,
        { lean: true, populate: { path: 'user', select: 'givenName surName' } }
      );
      if (!xlsxObject) {
        return next(
          errorWriter(req, 'Curation sample not found', 'getXlsxCurations', 404)
        );
      }
      fetchedObject = xlsxObject.object;
    } else {
      const xmlData = await XmlData.findOne(
        { _id: curationId, ...filter },
        { xml_str: 1, content: 1 },
        { lean: true }
      );
      if (!xmlData) {
        return next(
          errorWriter(req, 'Sample xml not found', 'getXlsxCurations', 404)
        );
      }
      const xmlJson = XlsxFileManager.jsonGenerator(xmlData.xml_str);
      const xmlObject = JSON.parse(xmlJson);
      if (!xmlObject.PolymerNanocomposite?.Control_ID) {
        xmlObject.PolymerNanocomposite.Control_ID =
          xmlObject.PolymerNanocomposite?.ID;
      }
      fetchedObject = parseXmlDataToBaseSchema(xmlObject.PolymerNanocomposite);
    }
    let baseSchemaObject = BaseSchemaObject;
    if (sheetName) {
      fetchedObject =
        fetchedObject[
          BaseObjectSubstitutionMap[sheetName?.toUpperCase()] ?? sheetName
        ] ?? null;
      baseSchemaObject =
        BaseSchemaObject[sheetName?.toUpperCase()] ??
        BaseSchemaObject[sheetName];
      if (baseSchemaObject?.cellValue) {
        fetchedObject = { [sheetName.toUpperCase()]: fetchedObject };
        baseSchemaObject = { [sheetName.toUpperCase()]: baseSchemaObject };
      }
    }
    latency.latencyCalculator(res);
    const baseCuratedObject = createBaseSchema(
      baseSchemaObject,
      fetchedObject,
      logger
    );
    return res.status(200).json(baseCuratedObject);
  } catch (err) {
    next(errorWriter(req, err, 'getXlsxCurations', 500));
  }
};

exports.duplicateXlsxCuration = async (req, res, next) => {
  const { logger, query, params, user } = req;

  logger.info('duplicateXlsxCurations Function Entry:');

  const { curationId } = params;
  const { isNew } = query;

  try {
    let duplicateCuration;
    if (isNew === 'true') {
      const xlsxObject = await CuratedSamples.findOne(
        { _id: curationId },
        null,
        { lean: true }
      );
      if (!xlsxObject) {
        return next(
          errorWriter(
            req,
            'Curation sample not found',
            'duplicateXlsxCurations',
            404
          )
        );
      }
      const { _id, ...duplicatedObject } = xlsxObject;
      const controlID = await generateDuplicateControlID(
        duplicatedObject.object.Control_ID,
        isNew
      );
      duplicatedObject.object.Control_ID = controlID;
      const duplicateCurationObject = new CuratedSamples({
        ...duplicatedObject,
        curationState: CurationStateDefault
      });
      duplicateCurationObject.object.ID = duplicateCurationObject._id;
      duplicateCuration = await duplicateCurationObject.save();
    } else {
      const xmlData = await XmlData.findOne({ _id: curationId }, null, {
        lean: true
      });
      if (!xmlData) {
        return next(
          errorWriter(
            req,
            'Sample xml not found',
            'duplicateXlsxCurations',
            404
          )
        );
      }
      const { _id, xml_str: xmlStr, title, ...duplicatedObject } = xmlData;
      const xmlJson = XlsxFileManager.jsonGenerator(xmlStr);
      const xmlObject = JSON.parse(xmlJson);
      const parsedCurationObject = parseXmlDataToBaseSchema(
        xmlObject.PolymerNanocomposite
      );
      const controlID = await generateDuplicateControlID(
        title.split('.xml')[0],
        isNew
      );
      parsedCurationObject.Control_ID = controlID;
      parsedCurationObject.ID = controlID;
      let xml = XlsxFileManager.xmlGenerator(
        JSON.stringify({ PolymerNanocomposite: parsedCurationObject })
      );
      xml = `<?xml version="1.0" encoding="utf-8"?>\n  ${xml}`;
      duplicateCuration = await XmlData.create({
        ...duplicatedObject,
        xml_str: xml,
        iduser: user._id,
        title: `${controlID}.xml`
      });
    }
    latency.latencyCalculator(res);
    return res
      .status(200)
      .json({ _id: duplicateCuration._id, isNew: isNew === 'true' });
  } catch (err) {
    next(errorWriter(req, err, 'duplicateXlsxCurations', 500));
  }
};

exports.getCurationXSD = async (req, res, next) => {
  const { isFile, isJson } = req.query;
  try {
    let { filteredObject: jsonOBject } = await createJsonObject(
      BaseSchemaObject,
      [],
      XSDJsonPlaceholder
    );

    jsonOBject = { PolymerNanocomposite: jsonOBject };
    const jsonSchema = XlsxFileManager.jsonSchemaGenerator(jsonOBject);

    if (isJson) {
      latency.latencyCalculator(res);
      return res.status(201).json(jsonSchema);
    }

    let xsd = XlsxFileManager.jsonSchemaToXsdGenerator(jsonSchema);
    const filePath = `${req.env?.FILES_DIRECTORY}/schema.xsd`;
    await fs.promises.writeFile(filePath, xsd);
    const parsedFile = await XlsxFileManager.parseXSDFile(req, filePath);

    if (isFile) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=curationschema.xsd'
      );
      latency.latencyCalculator(res);
      const stream = fs.createReadStream(parsedFile);
      return stream.pipe(res);
    }
    xsd = await fs.promises.readFile(parsedFile, 'utf8');
    latency.latencyCalculator(res);
    return res.status(201).json({ xsd });
  } catch (error) {
    next(errorWriter(req, error, 'getCurationXSD', 500));
  }
};

exports.updateXlsxCurations = async (req, res, next) => {
  try {
    const { user, body, logger, query } = req;
    let payload = body.payload;
    logger.info('updateXlsxCurations Function Entry:');

    const { xlsxObjectId, isBaseUpdate, isNew } = query;
    const userFilter =
      isNew === 'true' ? { user: user._id } : { iduser: user._id };
    const filter = user?.roles !== userRoles.isAdmin ? userFilter : {};

    // Fetch the storedObject based on the isNew flag
    let storedObject;
    const processedFiles = { toBeDeleted: [], toBeUploaded: [] };
    if (isNew === 'true') {
      const curationObject = await CuratedSamples.findOne(
        { _id: xlsxObjectId, ...filter },
        null,
        { lean: true, populate: { path: 'user', select: 'givenName surName' } }
      );
      storedObject = curationObject?.object;
    } else {
      const xmlData = await XmlData.findOne(
        { _id: xlsxObjectId, ...filter },
        { xml_str: 1, content: 1 },
        { lean: true }
      );
      if (xmlData) {
        const xmlJson = XlsxFileManager.jsonGenerator(xmlData.xml_str);
        const xmlObject = JSON.parse(xmlJson);
        storedObject = parseXmlDataToBaseSchema(xmlObject.PolymerNanocomposite);
      }
    }

    // Handle case where storedObject is not found
    if (!storedObject) {
      return next(
        errorWriter(
          req,
          `Curated sample ID: ${xlsxObjectId} not found`,
          'updateXlsxCurations',
          404
        )
      );
    }

    let baseCuratedObject;
    if (isBaseUpdate === 'true') {
      // Handle JSON update
      const { filteredObject, errors } = await createJsonObject(
        payload,
        [],
        undefined,
        processedFiles
      );
      if (Object.keys(errors)?.length) {
        return res.status(400).json({ fieldError: errors });
      }
      payload = filterNestedObject(filteredObject);
      baseCuratedObject = storedObject;
    } else {
      // Handle other updates
      baseCuratedObject = createBaseObject(BaseSchemaObject, storedObject);
    }

    const isObjChanged = !util.isDeepStrictEqual(baseCuratedObject, payload);
    if (isObjChanged) {
      // Create XML from filteredObject
      const filteredObject = filterNestedObject(payload);
      let xml = XlsxFileManager.xmlGenerator(
        JSON.stringify({ PolymerNanocomposite: filteredObject })
      );
      xml = `<?xml version="1.0" encoding="utf-8"?>\n  ${xml}`;

      // Update the database based on the isNew flag
      if (isNew === 'true') {
        await CuratedSamples.findOneAndUpdate(
          { _id: xlsxObjectId, ...filter },
          {
            $set: {
              object: filteredObject,
              curationState: CurationStateSubstitutionMap.Edit
            }
          },
          {
            new: true,
            lean: true,
            populate: { path: 'user', select: 'givenName surName' }
          }
        );
      } else {
        await XmlData.findOneAndUpdate(
          { _id: xlsxObjectId, ...filter },
          {
            $set: {
              content: { PolymerNanocomposite: { ...filteredObject } },
              xml_str: xml,
              curateState: 'Edit'
            }
          },
          { new: true, lean: true }
        );
      }

      if (processedFiles.toBeUploaded.length) {
        for (const file of processedFiles.toBeUploaded) {
          const isTif = XlsxFileManager.isTifFile(file.path);
          if (isTif) {
            await Task.create({
              serviceName: 'convertImageToPng',
              info: {
                ref: file.path,
                sampleID: xlsxObjectId
              }
            });
          } else {
            FileStorage.minioPutObject(file, req);
          }
        }
      }

      if (processedFiles.toBeDeleted.length) {
        processedFiles.toBeDeleted.forEach(
          async (newReq) =>
            await FileController.deleteFile(newReq, {}, (fn) => fn)
        );
      }

      latency.latencyCalculator(res);
      return res.status(200).json(req.body.payload);
    }

    return next(errorWriter(req, 'No changes', 'updateXlsxCurations', 304));
  } catch (err) {
    next(errorWriter(req, err, 'updateXlsxCurations', 500));
  }
};

exports.deleteXlsxCurations = async (req, res, next) => {
  const { user, logger, query } = req;
  logger.info('deleteXlsxCurations Function Entry:');

  const { xlsxObjectId, dataset, isNew } = query;
  const isNewCuration = isNew === 'true';
  const userFilter = isNewCuration ? { user: user._id } : { iduser: user._id };
  const filter = user?.roles !== userRoles.isAdmin ? userFilter : {};
  const entityState = isNewCuration ? 'Approved' : 'IngestSuccess';
  try {
    if (xlsxObjectId) {
      const model = isNewCuration ? CuratedSamples : XmlData;
      const curation = await model.findOne(
        { _id: xlsxObjectId, ...filter },
        null,
        {
          lean: true
        }
      );
      if (!curation) {
        return next(
          errorWriter(
            req,
            'Curation sample not found',
            'deleteXlsxCurations',
            404
          )
        );
      }
      if (curation.entityState === entityState) {
        return next(
          errorWriter(
            req,
            'Curation is already approved and pushed to fuseki database',
            'deleteXlsxCurations',
            403
          )
        );
      }
      let xlsxObject = await model.findOneAndDelete(
        { _id: xlsxObjectId, ...filter },
        { lean: true }
      );
      if (isNewCuration) {
        const imageFiles = xlsxObject?.object?.MICROSTRUCTURE?.ImageFile;
        if (imageFiles?.length) {
          for (const { File } of imageFiles) {
            const file = File.split('/api/files/').pop();
            const otherCurationCount = await model.countDocuments({
              'object.MICROSTRUCTURE.ImageFile.File': File,
              _id: { $ne: xlsxObjectId }
            });
            if (otherCurationCount === 0) {
              const newReq = {
                params: { fileId: file.split('?')[0] },
                isInternal: true
              };
              await FileController.deleteFile(newReq, {}, (fn) => fn);
            }
          }
        }
      } else if (xlsxObject?.xml_str) {
        const xmlJson = XlsxFileManager.jsonGenerator(xlsxObject.xml_str);
        const xmlObject = JSON.parse(xmlJson);
        xlsxObject = parseXmlDataToBaseSchema(xmlObject.PolymerNanocomposite);
        const imageFiles = xlsxObject?.MICROSTRUCTURE?.ImageFile;
        if (imageFiles?.length) {
          for (const { File } of imageFiles) {
            const blobId = File.split('?id=').pop();
            const otherCurationCount = await model.countDocuments({
              'MICROSTRUCTURE.ImageFile.File': File,
              _id: { $ne: xlsxObjectId }
            });

            if (otherCurationCount === 0) {
              await FsFile.findOneAndDelete({ _id: blobId });
            }
          }
        }
      }

      await DatasetId.findOneAndUpdate(
        { _id: xlsxObject?.dataset }, // TODO (@tee): Check if this is correct. Should we be calling this if value can be undefined?
        { $pull: { samples: xlsxObject?._id } },
        { new: true }
      );
      latency.latencyCalculator(res);
      return res.status(200).json({
        message: `Curated sample ID: ${xlsxObjectId} successfully deleted`
      });
    } else if (dataset) {
      const datasets = await DatasetId.findOneAndDelete(
        { _id: dataset, ...filter },
        { lean: true }
      );

      if (!datasets) {
        return next(
          errorWriter(
            req,
            `Dataset ID: ${query.dataset} not found`,
            'deleteXlsxCurations',
            404
          )
        );
      }

      await CuratedSamples.deleteMany({ _id: { $in: datasets.samples } });
      latency.latencyCalculator(res);
      return res
        .status(200)
        .json({ message: `Dataset ID: ${query.dataset} successfully deleted` });
    }
  } catch (err) {
    next(errorWriter(req, err, 'deleteXlsxCurations', 500));
  }
};

/**
 * @description Appends additional uploaded files & generate json object for xml table
 * @param {Object} parsedCSVData - The read csv data from the csv file
 * @param {Object} storedObject - The stored object retrieved from the database
 * @returns {Object} - Newly generated xml table json object
 */
const appendUploadedFiles = (parsedCSVData) => {
  const data = {};
  const element = parsedCSVData[0];
  const headerValues = Object.keys(element);
  const headers = headerValues.map((value, index) => {
    const header = {
      _attributes: {
        id: `${index}`
      },
      _text: value
    };
    return header;
  });

  const rows = parsedCSVData.map((row, index) => {
    const rowData = {
      _attributes: {
        id: index
      },
      column: Object.values(row).map((value, index) => ({
        _attributes: { id: `${index}` },
        _text: value
      }))
    };
    return rowData;
  });
  data.headers = { column: headers };
  data.rows = { row: rows };
  return data;
};

/**
 * @method createMaterialObject
 * @description Function to parse and curate xlsx object
 * @param {String} path - The path to the xlsx spreadsheet to be parsed
 * @param {Object} BaseObject - The json structure which holds all spreadsheet values and cell location
 * @param {Object} validListMap - The map of all valid curation lists
 * @param {Object} uploadedFiles - The list of all uploaded files data
 * @param {Object} errors - Object created to store errors that occur while parsing the spreadsheets
 * @returns {Object} - Newly curated object or errors that occur while  proces
 */
exports.createMaterialObject = async (
  // TODO (@tee): Missing decorators (processedFiles, etc)
  path,
  BaseObject,
  validListMap,
  uploadedFiles,
  processedFiles,
  sheetsData = {},
  logger,
  isParentCall,
  errors = {}
) => {
  const filteredObject = {};

  for (const property in BaseObject) {
    const propertyValue = BaseObject[property];

    if (propertyValue.type === 'replace_nested') {
      const objArr = [];

      for (const prop of propertyValue.values) {
        const newObj = await this.createMaterialObject(
          path,
          prop,
          validListMap,
          uploadedFiles,
          processedFiles,
          sheetsData,
          logger,
          isParentCall,
          errors
        );
        const value = Object.values(newObj)[0];

        if (value) {
          objArr.push(value);
        }
      }

      if (objArr.length > 0) {
        filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
          objArr;
      }
    } else if (Array.isArray(propertyValue?.values)) {
      let multiples = propertyValue.values;
      let cellValue;
      if (propertyValue.type === 'varied_multiples') {
        const [sheetName, row, col] = propertyValue.cellValue
          .replace(/[[\]]/g, '')
          .split(/\||,/);

        if (!Object.getOwnPropertyDescriptor(sheetsData, sheetName)) {
          try {
            sheetsData[sheetName] = await XlsxFileManager.xlsxFileReader(
              path,
              sheetName
            );
          } catch (error) {
            logger.info(`${sheetName} worksheet not found`);
            // errors[sheetName] = `${sheetName} worksheet not found`;
          }
        }

        // added plus(+) to parse as integer
        cellValue = sheetsData[sheetName]?.[+row]?.[+col];
        BaseObject[cellValue] = BaseObject[property];
        multiples = BaseObject[cellValue]?.values;
        delete BaseObject[property];
      }
      const objArr = [];
      for (const prop of multiples) {
        const newObj = await this.createMaterialObject(
          path,
          prop,
          validListMap,
          uploadedFiles,
          processedFiles,
          sheetsData,
          logger,
          isParentCall,
          errors
        );

        if (Object.keys(newObj).length > 0) {
          objArr.push(newObj);
        }
      }

      if (objArr.length > 0) {
        filteredObject[
          cellValue ?? BaseObjectSubstitutionMap[property] ?? property
        ] = objArr;
      }
    } else if (Array.isArray(propertyValue)) {
      const objArr = [];

      for (const prop of propertyValue) {
        const newObj = await this.createMaterialObject(
          path,
          prop,
          validListMap,
          uploadedFiles,
          processedFiles,
          sheetsData,
          logger,
          isParentCall,
          errors
        );

        if (Object.keys(newObj).length > 0) {
          objArr.push(newObj);
        }
      }
      if (objArr.length > 0) {
        filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
          objArr;
      }
    } else if (Object.getOwnPropertyDescriptor(propertyValue, 'cellValue')) {
      const [sheetName, row, col] = propertyValue.cellValue
        .replace(/[[\]]/g, '')
        .split(/\||,/);

      if (!Object.getOwnPropertyDescriptor(sheetsData, sheetName)) {
        try {
          sheetsData[sheetName] = await XlsxFileManager.xlsxFileReader(
            path,
            sheetName
          );
        } catch (error) {
          logger.info(`${sheetName} worksheet not found`);
          // errors[sheetName] = `${sheetName} worksheet not found`;
        }
      }

      // added plus(+) to parse as integer
      const cellValue = sheetsData[sheetName]?.[+row]?.[+col];

      if (cellValue) {
        if (Object.getOwnPropertyDescriptor(propertyValue, 'validList')) {
          const validListKey = propertyValue.validList;
          const validList = validListMap[validListKey];

          if (!validList && cellValue !== null) {
            filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
              cellValue;
          } else if (validList?.includes(cellValue)) {
            filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
              cellValue;
          } else if (cellValue !== null) {
            errors[validListKey] = 'Invalid value';
          }
        } else if (propertyValue.type === 'File') {
          const regex = new RegExp(`${cellValue}$`, 'gi');
          const file = uploadedFiles?.find((file) => regex.test(file?.path));

          if (file) {
            const filesDirectory = process.env?.FILES_DIRECTORY
              ? `${process.env?.FILES_DIRECTORY}/`
              : 'mm_files/';
            const filename = file.path.split(filesDirectory)[1];
            const processableRegex = /(?=.*?((?:.csv|.tsv))$)/gi;

            const isProccessable = processableRegex.test(filename);
            if (isProccessable) {
              const jsonData = await XlsxFileManager.parseCSV(file.path);
              const data = appendUploadedFiles(jsonData);
              filteredObject.data = data;

              const newReq = {
                params: { fileId: filename },
                isInternal: true,
                env: process.env
              };
              processedFiles.toBeDeleted.push(newReq);
            } else {
              const fileDetails = {
                filename,
                mimetype:
                  SupportedFileResponseHeaders[`.${filename.split('.').pop()}`],
                path: file.path
              };

              filteredObject[
                BaseObjectSubstitutionMap[property] ?? property
              ] = `/api/files/${filename}?isStore=true`;

              const isTif = XlsxFileManager.isTifFile(file.path);
              if (isParentCall || isTif) {
                processedFiles.toBeUploaded.push(fileDetails);
              } else {
                FileStorage.minioPutObject(fileDetails, { logger });
              }
            }
          } else {
            errors[cellValue] = 'file not uploaded';
          }
        } else {
          if (cellValue !== null) {
            filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
              cellValue;
          }
        }
      } else if (cellValue === null && propertyValue?.default) {
        filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
          propertyValue.default;
      } else if (cellValue === null && propertyValue?.required) {
        errors[property] = `${property} cannot be null`;
      }
    } else {
      const nestedObj = await this.createMaterialObject(
        path,
        propertyValue,
        validListMap,
        uploadedFiles,
        processedFiles,
        sheetsData,
        logger,
        isParentCall,
        errors
      );
      const nestedObjectKeys = Object.keys(nestedObj);

      if (nestedObjectKeys.length > 0) {
        filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
          nestedObj;
      }

      if (
        nestedObjectKeys.length === 1 &&
        nestedObjectKeys[0] === 'description'
      ) {
        filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
          nestedObj[nestedObjectKeys[0]];
      }
    }
  }

  if (Object.keys(errors)?.length) {
    return { errors, errorCount: Object.keys(errors)?.length };
  }

  return filteredObject;
};

async function checkFileExistence(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

const createJsonObject = async (
  BaseObject,
  validListMap,
  XSDJsonPlaceholder,
  processedFiles = { toBeDeleted: [], toBeUploaded: [] }
) => {
  const filteredObject = {};
  const errors = {};

  for (const property in BaseObject) {
    const propertyValue = BaseObject[property];

    if (propertyValue.type === 'replace_nested') {
      const objArr = [];

      for (const prop of propertyValue.values) {
        const newObj = await createJsonObject(
          prop,
          validListMap,
          XSDJsonPlaceholder,
          processedFiles
        );
        const value = Object.values(newObj)?.[0];

        if (value) {
          objArr.push(value);
        }
      }

      if (objArr.length > 0) {
        filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
          objArr;
      }
    } else if (Array.isArray(propertyValue?.values)) {
      const multiples = propertyValue.values;
      let cellValue;
      const objArr = [];
      const errorArr = [];
      for (const prop of multiples) {
        const newObj = await createJsonObject(
          prop,
          validListMap,
          XSDJsonPlaceholder,
          processedFiles
        );

        if (Object.keys(newObj.filteredObject).length > 0) {
          objArr.push(newObj.filteredObject);
        }
        if (Object.keys(newObj.errors).length) {
          errorArr.push(newObj.errors);
        }
      }

      if (propertyValue.type === 'varied_multiples') {
        const possibleValues = XSDJsonPlaceholder?.varied_multiples?.[
          property
        ] ?? [propertyValue.cellValue];
        possibleValues.forEach((cellValue) => {
          if (objArr.length) {
            filteredObject[cellValue] = objArr;
          }
          if (errorArr.length) {
            errors[cellValue] = errorArr;
          }
        });
        delete BaseObject[property];
      } else if (objArr.length > 0) {
        filteredObject[
          cellValue ?? BaseObjectSubstitutionMap[property] ?? property
        ] = objArr;
      }
      if (errorArr.length) {
        errors[cellValue ?? property] = errorArr;
      }
    } else if (Array.isArray(propertyValue)) {
      filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
        propertyValue;
    } else if (Object.getOwnPropertyDescriptor(propertyValue, 'cellValue')) {
      if (propertyValue.type === 'File') {
        if (propertyValue?.required && !propertyValue.cellValue) {
          errors[property] = `${property} cannot be null`;
        } else {
          const regex = /(?=.*?((?:.csv|.tsv)))(?=.*?(isFileStore=true)$)/gi;
          const isProccessable = regex.test(propertyValue.cellValue);
          if (isProccessable) {
            const file = propertyValue.cellValue.split('/').pop();
            const newReq = {
              params: { fileId: file.split('?')[0] },
              query: { isFileStore: true },
              isInternal: true,
              env: process.env // TODO: Fix later, there is already a middleware that parses env var
            };

            const dataStream = await FileController.fileContent(
              newReq,
              {},
              (fn) => fn
            );
            if (dataStream) {
              const jsonData = await XlsxFileManager.parseCSV(null, dataStream);
              const data = appendUploadedFiles(jsonData);
              filteredObject.data = data;
              processedFiles.toBeDeleted.push(newReq);
            } else {
              errors[property] = 'file not found';
            }
          } else {
            const filename = propertyValue.cellValue
              ?.split('files/')[1]
              ?.split('?')[0];

            if (filename) {
              const fileExist = await checkFileExistence(
                `${process.env?.FILES_DIRECTORY}/${filename}`
              );
              if (!fileExist) {
                // TODO (@tee): Refactor!! This logic is repeated in else block
                filteredObject[
                  BaseObjectSubstitutionMap[property] ?? property
                ] = XSDJsonPlaceholder?.File ?? propertyValue.cellValue;
              } else {
                const fileDetails = {
                  filename,
                  mimetype:
                    SupportedFileResponseHeaders[
                      `.${filename.split('.').pop()}`
                    ],
                  path: `${process.env?.FILES_DIRECTORY}/${filename}`,
                  env: process.env
                };

                filteredObject[
                  BaseObjectSubstitutionMap[property] ?? property
                ] =
                  XSDJsonPlaceholder?.File ??
                  `/api/files/${filename}?isStore=true`;
                processedFiles.toBeUploaded.push(fileDetails);
              }
            } else {
              filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
                XSDJsonPlaceholder?.File ?? propertyValue.cellValue;
            }
          }
        }
      } else {
        if (propertyValue?.required && !propertyValue.cellValue) {
          errors[property] = `${property} cannot be null`;
        } else {
          filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
            XSDJsonPlaceholder?.String ?? propertyValue.cellValue;
        }
      }
    } else {
      const nestedObj = await createJsonObject(
        propertyValue,
        validListMap,
        XSDJsonPlaceholder,
        processedFiles
      );
      const nestedObjectKeys = Object.keys(nestedObj.filteredObject);
      const nestedErrorKeys = Object.keys(nestedObj.errors);
      if (nestedObjectKeys.length > 0) {
        filteredObject[BaseObjectSubstitutionMap[property] ?? property] =
          nestedObj.filteredObject;
      }
      if (nestedErrorKeys.length > 0) {
        errors[property] = nestedObj.errors;
      }
    }
  }

  return { filteredObject, errors, processedFiles };
};

const parseXmlDataToBaseSchema = (xmlJson) => {
  const filteredObject = {};
  const filteredOut = {};
  for (const property in xmlJson) {
    const propertyValue = xmlJson[property];
    if (property === '_declaration') {
      filteredOut[property] = propertyValue;
    } else if (Array.isArray(propertyValue)) {
      filteredObject[property] = propertyValue.map((obj) => {
        if (obj._text) return obj._text;
        return parseXmlDataToBaseSchema(obj);
      });
    } else if (propertyValue?.headers && propertyValue?.rows) {
      filteredObject[property] = {
        ...propertyValue.headers,
        ...propertyValue.rows
      };
    } else if (propertyValue?.column && propertyValue?.row) {
      filteredObject[property] = {
        ...propertyValue
      };
    } else if (Object.getOwnPropertyDescriptor(propertyValue, '_text')) {
      filteredObject[property] = propertyValue._text;
    } else {
      const nestedObj = parseXmlDataToBaseSchema(propertyValue);
      if (Object.keys(nestedObj).length > 0) {
        filteredObject[property] = nestedObj;
      }
    }
  }

  return filteredObject;
};

exports.getCurationSchemaObject = async (req, res, next) => {
  req.logger.info('getCurationSchemaObject Function Entry:');
  const { sheetName, getXSD, isFile, isJson, getSheetNames } = req.query;
  if (getXSD || isFile || isJson) return next();
  if (getSheetNames) {
    const sheetNames = [];
    for (const property in BaseSchemaObject) {
      sheetNames.push(property);
    }
    return res.status(200).json(sheetNames);
  }
  const result = BaseSchemaObject[sheetName?.toUpperCase()]
    ? BaseSchemaObject[sheetName?.toUpperCase()]
    : BaseSchemaObject;

  return res.status(200).json(result);
};

exports.approveCuration = async (req, res, next) => {
  const { logger, body, user } = req;
  logger.info('approveCuration Function Entry:');
  const { curationId, isNew } = body;

  try {
    const isAdmin = user?.roles === userRoles.isAdmin;
    const model = isNew ? CuratedSamples : XmlData;
    const entityState = isAdmin ? (isNew ? 'Approved' : 'IngestSuccess') : null;
    const curationState = isAdmin
      ? CurationStateSubstitutionMap.Curated
      : CurationStateSubstitutionMap.Review;

    const update = {
      $set: {
        ...(entityState && { entityState }),
        [isNew ? 'curationState' : 'curateState']: curationState
      }
    };

    const options = { new: true, lean: true };
    const curation = await model.findOneAndUpdate(
      { _id: curationId },
      update,
      options
    );

    if (!curation) {
      return next(
        errorWriter(
          req,
          `Curation with ID: ${curationId} not found`,
          'approveCuration',
          404
        )
      );
    }

    return res.status(200).json(curation);
  } catch (error) {
    return next(errorWriter(req, error, 'approveCuration', 500));
  }
};

exports.createChangeLog = async (req, res, next) => {
  const { logger, body, user } = req;
  logger.info('createChangeLog(): Function entry');
  const userId = user._id;
  const { resourceId, change, published } = body;

  try {
    const filter = { resourceID: resourceId };
    const update = {
      $push: {
        changes: { change, date: new Date(), published, user: userId }
      }
    };
    const options = {
      upsert: true,
      new: true
    };

    const changeLog = await ChangeLog.findOneAndUpdate(filter, update, options);

    successWriter(req, JSON.stringify(changeLog), 'createChangeLog');
    latency.latencyCalculator(res);
    return res.status(201).json(changeLog);
  } catch (err) {
    next(errorWriter(req, err, 'createChangeLog', 500));
  }
};

exports.getChangeLogs = async (req, res, next) => {
  const { logger, params, query } = req;
  logger.info('getChangeLogs(): Function entry');

  const { resourceId } = params;
  const page = parseInt(query?.page) || 1;
  const pageSize = parseInt(query?.pageSize) || 10;
  const published = query?.published;

  try {
    const resourceChangeLog = await ChangeLog.findOne({
      resourceID: resourceId
    });

    if (!resourceChangeLog) {
      // return next(errorWriter(req, 'Change log not found', 'getChangeLogs', 404));
      return res.status(200).json({});
    }

    let changeLogs;

    if (published) {
      const publishedChanges = resourceChangeLog.changes.filter(
        (change) => change.published
      );
      changeLogs = publishedChanges[publishedChanges.length - 1];
    } else {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      changeLogs = resourceChangeLog.changes.slice(startIndex, endIndex);
    }

    successWriter(req, JSON.stringify(changeLogs), 'getChangeLogs');
    latency.latencyCalculator(res);
    return res.status(200).json(changeLogs);
  } catch (err) {
    next(errorWriter(req, err, 'getChangeLogs', 500));
  }
};

exports.curationRehydration = async (req, res, next) => {};

/**
 * @description Function to convert valid curation list to object mapping
 * @param {Object} validCurationList - The valid array/List of valid validCurationList
 * @returns {Object} - A valid list object
 */
const generateCurationListMap = (validCurationList) => {
  const validListObject = {};

  for (const validList of validCurationList) {
    validListObject[validList.field] = validList.values;
  }
  return validListObject;
};

/**
 * @description Function to filter out all null/undefined values in the object
 * @param {Object} curatedBaseObject - The curated base object which contains all fields based on the BaseSchemaObject
 * @returns {Object} The filtered curated base object stripped off all null values
 */
function filterNestedObject(curatedBaseObject) {
  const filteredObject = {};
  for (const property in curatedBaseObject) {
    const value = curatedBaseObject[property];
    if (Array.isArray(value)) {
      const objectArray = [];
      for (const property of value) {
        if (typeof property !== 'object') {
          objectArray.push(property);
        } else {
          const newObj = filterNestedObject(property);
          if (Object.keys(newObj).length > 0) {
            objectArray.push(newObj);
          }
        }
      }
      if (objectArray.length > 0) {
        filteredObject[property] = objectArray;
      }
    } else if (typeof value === 'object') {
      const nestedObj = filterNestedObject(value);

      if (Object.keys(nestedObj).length > 0) {
        filteredObject[property] = nestedObj;
      }
    } else if (value !== null) {
      filteredObject[property] = value;
    }
  }
  return filteredObject;
}

/**
 * @description Function to create schema object using the BaseObject
 * @param {Object} BaseObject - The json structure which holds all spreadsheet values and cell location
 * @param {Object} storedObject - The stored object retrieved from the database
 * @returns {Object} - Newly curated base object
 */
const createBaseObject = (baseObject, storedObject) => {
  const curatedBaseObject = {};

  for (const [key, value] of Object.entries(baseObject)) {
    const propertyValue = value;
    const propertyKey = BaseObjectSubstitutionMap[key] || key;

    if (Array.isArray(propertyValue?.values)) {
      curatedBaseObject[propertyKey] = propertyValue.values.map((obj, i) =>
        createBaseObject(obj, storedObject?.[key]?.[i])
      );
    } else if (propertyValue.cellValue) {
      curatedBaseObject[propertyKey] = storedObject?.[key] || null;
    } else {
      const nestedObj = createBaseObject(
        propertyValue,
        storedObject?.[propertyKey]
      );

      if (Object.keys(nestedObj).length > 0) {
        curatedBaseObject[propertyKey] = nestedObj;
      }
    }
  }

  return curatedBaseObject;
};

const createBaseSchema = (baseObject, storedObject, logger) => {
  const curatedBaseObject = {};

  for (const property in baseObject) {
    const propertyValue = baseObject[property];
    const propertyKey = BaseObjectSubstitutionMap[property] || property;

    if (propertyValue?.type === 'replace_nested') {
      curatedBaseObject[propertyKey] = {
        ...propertyValue,
        values: storedObject?.[property] || []
      };
    } else if (Array.isArray(propertyValue?.values)) {
      let selectedValue;
      if (propertyValue.type === 'varied_multiples') {
        selectedValue =
          XSDJsonPlaceholder.varied_multiples.ProcessingMethod.find(
            (value) => storedObject && Object.keys(storedObject).includes(value)
          );
      }

      let objectArray;
      let currentStoredObj =
        storedObject?.[propertyKey] ?? storedObject?.[selectedValue];

      if (Array.isArray(currentStoredObj)) {
        if (propertyKey === 'ChooseParameter') {
          const multiplesSchemaMap = {};
          for (const multiple of propertyValue.values) {
            const multipleKey = Object.keys(multiple)[0];
            multiplesSchemaMap[multipleKey] = multiple;
          }
          objectArray = currentStoredObj.map((obj) => {
            if (typeof obj === 'object') {
              const currentMultipleKey = Object.keys(obj)[0];
              const currentMultipleSchema =
                multiplesSchemaMap[currentMultipleKey];
              const multipleObj = { ...currentMultipleSchema };
              return createBaseSchema(multipleObj, obj, logger);
            }
            const multipleObj = { ...propertyValue.values[0] };
            return createBaseSchema(multipleObj, obj, logger);
          });
        } else {
          objectArray = currentStoredObj.map((obj) => {
            const multipleObj = { ...propertyValue.values[0] };
            return createBaseSchema(multipleObj, obj, logger);
          });
        }
      } else if (typeof currentStoredObj === 'object') {
        currentStoredObj = [currentStoredObj];
        objectArray = propertyValue.values.map((obj, i) => {
          return createBaseSchema(obj, currentStoredObj?.[i], logger);
        });
      } else {
        objectArray = propertyValue.values.map((obj, i) =>
          createBaseSchema(obj, currentStoredObj?.[i], logger)
        );
      }

      curatedBaseObject[propertyKey] = {
        ...propertyValue,
        values: objectArray,
        cellValue: propertyValue?.cellValue ? selectedValue : undefined
      };
    } else if (propertyValue?.cellValue) {
      if (
        propertyValue.type === 'File' &&
        (storedObject?.[propertyKey]?.headers ||
          storedObject?.[propertyKey]?.data ||
          storedObject?.[propertyKey]?.column ||
          storedObject?.[propertyKey]?.row)
      ) {
        const filePath = XlsxFileManager.generateCSVData(
          storedObject?.[propertyKey],
          { logger }
        );
        curatedBaseObject[propertyKey] = {
          ...propertyValue,
          cellValue: filePath
        };
      } else {
        curatedBaseObject[propertyKey] = {
          ...propertyValue,
          cellValue: storedObject?.[property] || null
        };
      }
    } else {
      let nestedObj;
      if (Array.isArray(storedObject?.[propertyKey])) {
        const generatedMultiple = storedObject[propertyKey].map((obj) => {
          const ObjSchema = { ...propertyValue };
          return createBaseSchema(ObjSchema, obj, logger);
        });
        nestedObj = {
          type: 'multiples',
          values: generatedMultiple
        };
      } else {
        nestedObj =
          property === 'SYNTHESIS AND PROCESSING'
            ? createBaseSchema(
                propertyValue,
                storedObject[BaseObjectSubstitutionMap[property]],
                logger
              )
            : createBaseSchema(
                propertyValue,
                storedObject?.[BaseObjectSubstitutionMap[property] || property],
                logger
              );
      }

      if (Object.keys(nestedObj).length > 0) {
        curatedBaseObject[propertyKey] = nestedObj;
      }
    }
  }

  return curatedBaseObject;
};
