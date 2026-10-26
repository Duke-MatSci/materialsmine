const multer = require('multer');
const fs = require('fs');
const path = require('path');
const decompress = require('decompress');
const {
  uniqueNamesGenerator,
  adjectives,
  names,
  animals
} = require('unique-names-generator');
const minioClient = require('../utils/minio');
const { deleteFile } = require('../utils/fileManager');
const { MinioBucket, MetamineBucket } = require('../../config/constant');

const nameGenConfig = {
  dictionaries: [adjectives, animals, names],
  length: 3,
  style: 'lowerCase'
};

const shortName = uniqueNamesGenerator(nameGenConfig);

const MIME_MAP = {
  '.csv': 'text/csv',
  '.tsv': 'text/tab-separated-values',
  '.txt': 'text/plain',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.webp': 'image/webp',
  '.xml': 'application/xml'
};

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, req.env?.FILES_DIRECTORY ?? 'mm_files');
  },
  filename: (req, file, cb) => {
    cb(
      null,
      shortName + '-' + new Date().toISOString() + '-' + file.originalname
    );
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/tif' ||
    file.mimetype === 'image/tiff' ||
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/zip' ||
    file.mimetype === 'application/x-zip-compressed' ||
    file.mimetype === 'application/octet-stream' ||
    file.mimetype === 'text/tab-separated-values' ||
    file.mimetype === 'text/plain' ||
    file.mimetype === 'text/xml' ||
    file.mimetype === 'application/xml'
  ) {
    cb(null, true);
  } else {
    req.logger.error(
      `fileFilter () => Files with ${file.mimetype} mimetype not acceptable`
    );
    cb(
      new Error(
        'Only .png, .jpg, .jpeg, .tiff, .tif, .csv, .zip, .xls, .xml and .xlsx format allowed!'
      ),
      false
    );
  }
};

const fileMgr = multer({ storage: fileStorage, fileFilter }).fields([
  { name: 'uploadfile', maxCount: 20 }
]);

const extractZipFiles = async (req, res, next) => {
  if (req.query?.extractZip !== 'true') return next();

  const files = req.files?.uploadfile;
  if (!files || files.length === 0) return next();

  const zipFiles = files.filter(
    (f) => path.extname(f.originalname).toLowerCase() === '.zip'
  );
  if (zipFiles.length === 0) return next();

  const filesDir = req.env?.FILES_DIRECTORY ?? 'mm_files';
  const extractFolder = path.join(
    filesDir,
    `sdd-extract-${Date.now()}`
  );

  try {
    fs.mkdirSync(extractFolder, { recursive: true });
    req.logger.info(
      `extractZipFiles: Extracting ${zipFiles.length} zip file(s) to ${extractFolder}`
    );

    const newFileEntries = [];

    for (const zipFile of zipFiles) {
      req.logger.info(
        `extractZipFiles: Extracting ${zipFile.originalname}`
      );

      const allExtracted = await decompress(zipFile.path, extractFolder);

      // Delete the original zip file from disk
      deleteFile(zipFile.path, req);

      // Remove __MACOSX folder if present
      const macosxPath = path.join(extractFolder, '__MACOSX');
      if (fs.existsSync(macosxPath)) {
        fs.rmSync(macosxPath, { recursive: true, force: true });
        req.logger.info('extractZipFiles: Removed __MACOSX folder');
      }

      // Filter to actual files (skip directories and __MACOSX entries)
      const extractedFiles = allExtracted.filter(
        (entry) =>
          entry.type === 'file' &&
          !entry.path.startsWith('__MACOSX') &&
          !entry.path.includes('/__MACOSX/')
      );

      req.logger.info(
        `extractZipFiles: Found ${extractedFiles.length} file(s) in ${zipFile.originalname}`
      );

      for (const entry of extractedFiles) {
        const originalName = path.basename(entry.path);
        const ext = path.extname(originalName).toLowerCase();
        const mimetype = MIME_MAP[ext] || 'application/octet-stream';
        const filePath = path.join(extractFolder, entry.path);

        // Generate a unique name per file (same pattern as multer storage)
        const uniquePrefix = uniqueNamesGenerator(nameGenConfig);
        const filename =
          uniquePrefix +
          '-' +
          new Date().toISOString() +
          '-' +
          originalName;

        let size = 0;
        try {
          size = fs.statSync(filePath).size;
        } catch (e) {
          req.logger.error(
            `extractZipFiles: Could not stat ${filePath}: ${e.message}`
          );
          continue;
        }

        newFileEntries.push({
          fieldname: 'uploadfile',
          originalname: originalName,
          mimetype,
          path: filePath,
          filename,
          size
        });
      }
    }

    // Replace zip entries with extracted file entries; keep non-zip files
    const nonZipFiles = files.filter(
      (f) => path.extname(f.originalname).toLowerCase() !== '.zip'
    );
    req.files.uploadfile = [...nonZipFiles, ...newFileEntries];

    req._extractedZipFolder = extractFolder;

    req.logger.info(
      `extractZipFiles: Total files after extraction: ${req.files.uploadfile.length}`
    );

    next();
  } catch (err) {
    req.logger.error(`extractZipFiles: Extraction failed: ${err.message}`);
    // Clean up the extract folder on error
    try {
      fs.rmSync(extractFolder, { recursive: true, force: true });
    } catch (_) {
      // ignore cleanup errors
    }
    next(err);
  }
};

const minioUpload = async (req, res, next) => {
  // Boolean flag which determines whether to upload to the object store.
  if (req.query?.isTemp) return next();

  const files = req.files?.uploadfile;
  if (!files) {
    return next();
  }

  try {
    const results = await Promise.allSettled(
      files.map((file) => minioPutObject(file, req))
    );

    // Clean up the extracted zip folder if present
    if (req._extractedZipFolder) {
      try {
        fs.rmSync(req._extractedZipFolder, { recursive: true, force: true });
        req.logger.info(
          'minioUpload: Cleaned up extracted zip folder'
        );
      } catch (e) {
        req.logger.error(
          `minioUpload: Failed to clean up extract folder: ${e.message}`
        );
      }
    }

    // Check for any failed uploads
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      req.logger.error(
        `minioUpload: ${failures.length} of ${results.length} uploads failed`
      );
      return next(failures[0].reason);
    }

    next();
  } catch (err) {
    next(err);
  }
};

const minioPutObject = (file, req) => {
  const bucketName =
    req.query?.isVisualizationCSV === 'true'
      ? process.env?.METAMINEBUCKET ?? MetamineBucket
      : process.env?.MINIO_BUCKET ?? MinioBucket;

  const metaData = {
    'Content-Type': file.mimetype,
    'X-Amz-Meta-Data': 'MaterialsMine Project'
  };

  return new Promise((resolve, reject) => {
    minioClient.fPutObject(
      bucketName,
      file.filename,
      file.path,
      metaData,
      (err, objInfo) => {
        deleteFile(file.path, req);
        if (err) {
          reject(err);
        } else {
          resolve(objInfo);
        }
      }
    );
  });
};

module.exports = {
  fileMgr,
  extractZipFiles,
  minioUpload,
  minioPutObject
};
