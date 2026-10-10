'use strict';

const XLSX = require('xlsx');
const csv = require('csv-parser');
const minioClient = require('./minio');
const FileManager = require('./fileManager');
const {
  MinioBucket,
  UNIT_IRI,
  FILE_FORMATS: FILE_FORMATS_ARR,
  SupportedFileResponseHeaders
} = require('../../config/constant');
const bucketName = process.env?.MINIO_BUCKET ?? MinioBucket;

/**
 * Fetch a distribution file stream using internal services (MinIO or local file store).
 * Parses the file URL to determine storage type and retrieves the stream directly.
 * @param {string} url - e.g. "http://localhost/api/files/some-file.csv?isStore=true"
 * @returns {Promise<ReadableStream>} File stream
 */
async function fetchFileStream(url) {
  const urlObj = new URL(url, 'http://localhost');
  const fileId = urlObj.pathname.split('/').pop();
  const isStore = urlObj.searchParams.get('isStore') === 'true';
  const isFileStore = urlObj.searchParams.get('isFileStore') === 'true';

  if (isStore) {
    return minioClient.getObject(bucketName, fileId);
  }

  if (isFileStore) {
    const req = {
      params: { fileId },
      env: process.env
    };
    const { fileStream } = await FileManager.findFile(req);
    return fileStream;
  }

  throw new Error(`Cannot determine storage type for file URL: ${url}`);
}

/**
 * Parse a readable CSV stream into an array of row objects.
 */
function parseCsvStream(stream) {
  return new Promise((resolve, reject) => {
    const rows = [];
    stream
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

/**
 * Collect a readable stream into a Buffer.
 */
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/* ────────────────────────── Unit Map ────────────────────────── */
const unitMap = UNIT_IRI;

/* ────────────────── File reference handling ────────────────── */

const FILE_FORMATS = new Set(FILE_FORMATS_ARR);

function fileSchemaType(filename) {
  const mime = SupportedFileResponseHeaders[getExtension(filename)] || '';
  if (mime.startsWith('image/')) return 'schema:ImageObject';
  if (mime.startsWith('text/')) return 'schema:Dataset';
  return 'schema:MediaObject';
}

function buildFileUrl(objectName) {
  return `/api/files/${encodeURIComponent(objectName)}?isStore=true`;
}

function objectExists(objectName) {
  return minioClient
    .statObject(bucketName, objectName)
    .then(() => true)
    .catch(() => false);
}

async function fetchAndStoreRemoteFile(url, logger) {
  const https = require('https');
  const http = require('http');
  const { randomUUID } = require('crypto');

  const parsedUrl = new URL(url);
  let fetchUrl = url;

  // Google Drive: convert share link to direct download
  const driveMatch = parsedUrl.hostname === 'drive.google.com' &&
    parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
  if (driveMatch) {
    fetchUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }

  const client = fetchUrl.startsWith('https') ? https : http;

  return new Promise((resolve, reject) => {
    client.get(fetchUrl, { headers: { 'User-Agent': 'MaterialsMine/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchAndStoreRemoteFile(res.headers.location, logger)
          .then(resolve)
          .catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}: HTTP ${res.statusCode}`));
        return;
      }

      const contentDisp = res.headers['content-disposition'] || '';
      const filenameMatch = contentDisp.match(/filename="?([^";]+)"?/);
      const originalName = filenameMatch
        ? filenameMatch[1]
        : parsedUrl.pathname.split('/').pop() || 'download';
      const ext = getExtension(originalName) || '';
      const objectName = `sdd-${randomUUID()}${ext}`;

      const contentType =
        res.headers['content-type'] || 'application/octet-stream';
      const metaData = {
        'Content-Type': contentType,
        'X-Amz-Meta-Data': 'MaterialsMine Project',
        'X-Amz-Meta-Source-Url': url
      };

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        minioClient.putObject(bucketName, objectName, buffer, buffer.length, metaData, (err) => {
          if (err) return reject(err);
          logger.info(`[sdd-serializer] Stored remote file as ${objectName} from ${url}`);
          resolve({ objectName, originalName });
        });
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Find a distribution entry whose label ends with the given filename.
 * Upload middleware prepends a unique prefix (e.g. "random-timestamp-filename.ext"),
 * so we match by suffix to find the original file.
 */
function findDistributionEntry(filename, distEntries) {
  const needle = filename.toLowerCase();
  return distEntries.find((entry) => {
    const label = (entry['rdfs:label'] || '').toLowerCase();
    return label === needle || label.endsWith(`-${needle}`);
  });
}

/**
 * Pre-process CSV rows to resolve file references.
 * Scans dict rows for format values of 'file' or 'url'.
 * For 'file', matches the CSV cell value against distribution entries by suffix.
 * Replaces raw cell values with resolved reference objects:
 *   { __fileRef: true, files: [{ url, name, schemaType }] }
 */
async function resolveFileReferences(csvRows, dict, distEntries, logger) {
  const fileColumns = dict.filter(
    (d) => d.format && FILE_FORMATS.has(d.format.toLowerCase())
  );
  if (!fileColumns.length) return csvRows;

  const resolved = csvRows.map((row) => ({ ...row }));

  for (const d of fileColumns) {
    const fmt = d.format.toLowerCase();
    const colKey = Object.keys(resolved[0] || {}).find(
      (k) => k.trim().toLowerCase() === d.column.trim().toLowerCase()
    );
    if (!colKey) continue;

    for (const row of resolved) {
      const cellValue = row[colKey];
      if (!cellValue || String(cellValue).trim() === '') continue;
      const raw = String(cellValue).trim();

      try {
        if (fmt === 'file') {
          const entry = findDistributionEntry(raw, distEntries);
          if (!entry) {
            logger.warn(
              `[sdd-serializer] File "${raw}" not found in distribution entries`
            );
            continue;
          }
          const url = entry['@id'];
          const name = entry['rdfs:label'] || raw;
          row[colKey] = {
            __fileRef: true,
            files: [{ url, name: raw, schemaType: fileSchemaType(raw) }]
          };
        } else if (fmt === 'url') {
          const { objectName, originalName } =
            await fetchAndStoreRemoteFile(raw, logger);
          row[colKey] = {
            __fileRef: true,
            files: [
              {
                url: buildFileUrl(objectName),
                name: originalName,
                schemaType: fileSchemaType(originalName)
              }
            ]
          };
        }
      } catch (err) {
        logger.error(
          `[sdd-serializer] Failed to resolve ${fmt} reference "${raw}": ${err.message}`
        );
      }
    }
  }

  return resolved;
}

/* ────────────────────────── Helpers ────────────────────────── */

/**
 * Generate a deterministic attribute @id from a sample ID and column name.
 * Strips the ?? inferred prefix, lowercases, replaces whitespace with hyphens.
 */
function generateAttributeId(sampleId, columnName) {
  const column = String(columnName).replace('??', '');
  return `${sampleId}/data/${column.replace(/\s+/g, '-').toLowerCase()}`;
}

/**
 * Resolve a reference value.
 * If the value contains ':' it is treated as a prefixed IRI and returned as-is.
 * Otherwise it is resolved to an internal attribute @id.
 */
function getInferredValues(sampleId, value) {
  if (!value) return undefined;
  const v = String(value).trim();
  if (!v) return undefined;
  if (v.includes(':')) return v;
  return [{ '@id': generateAttributeId(sampleId, v) }];
}

/**
 * Resolve a URI template by replacing {col_name} placeholders with CSV row values.
 */
function resolveTemplate(template, row) {
  return template.replace(/\{([^}]+)\}/g, (_, col) => {
    const key = Object.keys(row).find(
      (k) => k.trim().toLowerCase() === col.trim().toLowerCase()
    );
    return key !== undefined ? encodeURIComponent(row[key]) : '';
  });
}

/**
 * Match a dict column name to a CSV row key.
 * Tries exact match on column first, then falls back to label.
 * Both comparisons are case-insensitive but require full equality, not substring.
 */
function matchKeys(column, label, row) {
  const colNeedle = String(column).trim().toLowerCase();
  const keys = Object.keys(row);
  let key = keys.find((k) => k.trim().toLowerCase() === colNeedle);
  if (key === undefined && label && label !== column) {
    const labelNeedle = String(label).trim().toLowerCase();
    key = keys.find((k) => k.trim().toLowerCase() === labelNeedle);
  }
  return key !== undefined ? row[key] : undefined;
}

/**
 * Check how many non-inferred dict columns match a CSV's headers.
 * Returns the count of matched columns and a list of unmatched column names.
 */
function matchDictToHeaders(dict, csvHeaders) {
  const headerKeys = csvHeaders.map((h) => h.trim().toLowerCase());
  let matched = 0;
  const unmatched = [];

  for (const d of dict) {
    if (d.column.startsWith('??')) continue;
    const colNeedle = d.column.trim().toLowerCase();
    if (headerKeys.includes(colNeedle)) {
      matched++;
      continue;
    }
    if (d.label && d.label !== d.column) {
      const labelNeedle = d.label.trim().toLowerCase();
      if (headerKeys.includes(labelNeedle)) {
        matched++;
        continue;
      }
    }
    unmatched.push(d.column);
  }

  return { matched, unmatched };
}

/* ────────────────────── File classification ────────────────── */

const SDD_EXTENSIONS = ['.xlsx', '.xls'];
const CSV_EXTENSIONS = ['.csv', '.tsv'];

/**
 * Classify distribution entries into SDD (xlsx/xls) and CSV files.
 * @param {Object} distributionLd - The distribution LD object from nanopubSkeleton
 *   e.g. { 'mm:hasDistribution': { 'dcat:distribution': [...] } }
 * @returns {{ sddFile: Object|null, csvFiles: Object[] }}
 */
function classifyDistributionFiles(distributionLd) {
  const distArr =
    distributionLd?.['mm:hasDistribution']?.['dcat:distribution'] || [];
  const files = Array.isArray(distArr) ? distArr : [distArr];

  let sddFile = null;
  const csvFiles = [];

  for (const file of files) {
    const label = file['rdfs:label'] || file['@id'] || '';
    const ext = getExtension(label);
    if (SDD_EXTENSIONS.includes(ext)) {
      sddFile = file;
    } else if (CSV_EXTENSIONS.includes(ext)) {
      csvFiles.push(file);
    }
  }

  return { sddFile, csvFiles };
}

function getExtension(filename) {
  const dot = String(filename).lastIndexOf('.');
  return dot !== -1 ? String(filename).slice(dot).toLowerCase() : '';
}

/* ────────────────────── XLSX parsing ────────────────────────── */

const DICT_SHEET_NAME = 'Dictionary Mapping';
const DICT_COLUMNS = [
  'column',
  'label',
  'comment',
  'definition',
  'attribute',
  'attributeOf',
  'unit',
  'format',
  'time',
  'entity',
  'role',
  'relation',
  'inRelationTo',
  'wasDerivedFrom',
  'wasGeneratedBy',
  'template'
];

const CODE_MAPPINGS_SHEET_NAME = 'Code Mappings';

/**
 * Parse the Code Mappings sheet from an XLSX workbook.
 * Returns a map of lowercase code → { uri, label }.
 * @param {Object} workbook - Parsed XLSX workbook
 * @returns {Map<string, {uri: string, label: string}>}
 */
function parseCodeMappingsSheet(workbook) {
  const codeMappings = new Map();
  const sheet = workbook.Sheets[CODE_MAPPINGS_SHEET_NAME];
  if (!sheet) return codeMappings;

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const code = row[0] != null ? String(row[0]).trim() : '';
    const uri = row[1] != null ? String(row[1]).trim() : '';
    if (code && uri) {
      codeMappings.set(code.toLowerCase(), {
        uri,
        label: row[2] != null ? String(row[2]).trim() : ''
      });
    }
  }
  return codeMappings;
}

/**
 * Resolve a shorthand code to a URI using code mappings, then the hardcoded unitMap.
 * @param {string} code - The shorthand string (e.g., 'nm', 'mg/ml')
 * @param {Map} codeMappings - Parsed code mappings from the SDD
 * @returns {string|undefined} The resolved URI, or undefined
 */
function resolveCodeMapping(code, codeMappings) {
  if (!code) return undefined;
  const key = code.trim().toLowerCase();
  const mapped = codeMappings.get(key);
  if (mapped) return mapped.uri;
  return unitMap[key] || unitMap[code] || undefined;
}

/**
 * Parse the Dictionary Mapping sheet from an XLSX buffer.
 * Also parses the Code Mappings sheet if present.
 * @param {Buffer} buffer - XLSX file contents
 * @returns {{ dictRows: Object[], codeMappings: Map }} Parsed dictionary rows and code mappings
 */
function parseDictSheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[DICT_SHEET_NAME];
  if (!sheet) {
    throw new Error(`SDD file is missing the "${DICT_SHEET_NAME}" sheet.`);
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const dictRows = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;

    const entry = {};
    DICT_COLUMNS.forEach((col, idx) => {
      entry[col] = row[idx] != null ? String(row[idx]).trim() : '';
    });

    // label defaults to column if empty
    if (!entry.label) entry.label = entry.column;

    if (entry.column) dictRows.push(entry);
  }

  const codeMappings = parseCodeMappingsSheet(workbook);

  return { dictRows, codeMappings };
}

/* ────────────────────── Attribute generation ────────────────── */

/**
 * Populate common predicates on a node from a dict row definition.
 */
function applyDictPredicates(node, d, sampleId, codeMappings) {
  if (d.label && d.label !== d.column) node['rdfs:label'] = d.label;
  if (d.role) node['sio:hasRole'] = { '@id': d.role };
  if (d.inRelationTo) {
    const predicate = d.relation || 'sio:inRelationTo';
    node[predicate] = getInferredValues(sampleId, d.inRelationTo);
  }
  if (d.attributeOf) {
    node['sio:isAttributeOf'] = getInferredValues(sampleId, d.attributeOf);
  }
  if (d.unit) {
    const unitUri = resolveCodeMapping(d.unit, codeMappings);
    node['sio:hasUnit'] = [
      { ...(unitUri ? { '@type': unitUri } : {}), '@value': d.unit }
    ];
  }
  if (d.comment) node['rdfs:comment'] = d.comment;
  if (d.definition) node['skos:definition'] = d.definition;
  if (d.format && !FILE_FORMATS.has(d.format.toLowerCase())) {
    node['sio:hasFormat'] = d.format;
  }
  if (d.time) {
    node['sio:hasTimepoint'] = getInferredValues(sampleId, d.time);
  }
  if (d.wasDerivedFrom) {
    node['prov:wasDerivedFrom'] = getInferredValues(sampleId, d.wasDerivedFrom);
  }
  if (d.wasGeneratedBy) {
    node['prov:wasGeneratedBy'] = getInferredValues(
      sampleId,
      d.wasGeneratedBy
    );
  }
}

/**
 * Build structured assertion nodes from CSV rows and dict definitions.
 * Entity rows (have `entity`, no `attribute`) become structural parent nodes.
 * Attribute rows (have `attribute`) become leaf nodes nested under their parent
 * entity via the `attributeOf` column.
 *
 * @param {Object[]} csvRows - Parsed CSV row objects
 * @param {Object[]} dict - Parsed dict rows from XLSX
 * @param {string} npId - Nanopub ID (used to build sample IDs)
 * @param {number} fileOffset - Offset for sample numbering across multiple CSVs
 * @param {Map} codeMappings - Code mappings from the SDD
 * @returns {Object[]} Array of root assertion nodes (entities with nested attributes)
 */
function generateAttributes(
  csvRows,
  dict,
  npId,
  fileOffset,
  codeMappings = new Map()
) {
  const hasEntities = dict.some((d) => d.entity && !d.attribute);
  const samples = [];

  csvRows.forEach((row, rowIndex) => {
    const sampleId = `${npId}/sample-${fileOffset + rowIndex + 1}`;
    const nodeMap = new Map();
    const childrenOf = new Map();
    const rootNodes = [];

    dict.forEach((d) => {
      const isEntity = !!(d.entity && !d.attribute);
      const isInferred = d.column.startsWith('??');
      const value = isInferred ? undefined : matchKeys(d.column, d.label, row);

      if ((value === undefined || value === '') && !isInferred) return;

      const nodeId =
        d.template && !isInferred
          ? resolveTemplate(d.template, row)
          : generateAttributeId(sampleId, d.column);
      const node = { '@id': nodeId };

      if (isEntity) {
        node['@type'] = d.entity;
      } else if (d.attribute) {
        node['@type'] = d.attribute;
      }

      applyDictPredicates(node, d, sampleId, codeMappings);

      if (!isEntity && value !== undefined && value !== '') {
        if (value && typeof value === 'object' && value.__fileRef) {
          const fileNodes = value.files.map((f, i) => ({
            '@id': `${nodeId}/file-${i + 1}`,
            '@type': f.schemaType,
            'schema:contentUrl': f.url,
            'rdfs:label': f.name
          }));
          if (fileNodes.length === 1) {
            node['@type'] = fileNodes[0]['@type'];
            node['schema:contentUrl'] = fileNodes[0]['schema:contentUrl'];
          } else {
            node['sio:hasAttribute'] = fileNodes;
          }
        } else {
          node['sio:hasValue'] = isNaN(Number(value))
            ? String(value)
            : { '@value': Number(value), '@type': 'xsd:double' };
        }
      }

      const colKey = d.column.replace(/^\?\?/, '').trim().toLowerCase();
      nodeMap.set(colKey, node);

      if (d.attributeOf) {
        const parentKey = d.attributeOf
          .replace(/^\?\?/, '')
          .trim()
          .toLowerCase();
        if (!childrenOf.has(parentKey)) childrenOf.set(parentKey, []);
        childrenOf.get(parentKey).push(node);
      } else {
        rootNodes.push(node);
      }
    });

    if (hasEntities) {
      for (const [parentKey, children] of childrenOf) {
        const parent = nodeMap.get(parentKey);
        if (parent) {
          parent['sio:hasAttribute'] = children;
        } else {
          rootNodes.push(...children);
        }
      }
      samples.push(...rootNodes);
    } else {
      const allNodes = [...rootNodes];
      for (const children of childrenOf.values()) allNodes.push(...children);
      samples.push({
        '@id': sampleId,
        '@type': 'sio:SIO_001050',
        'sio:hasAttribute': allNodes
      });
    }
  });

  return samples;
}

/* ────────────────── Main: buildSddAttributes ────────────────── */

const SDD_BATCH_SIZE = 500;

/**
 * Build the sio:hasAttribute array for an SDD nanopub assertion.
 *
 * 1. Classifies distribution files into SDD (xlsx) and CSV(s)
 * 2. Fetches & parses the XLSX Dictionary Mapping sheet
 * 3. Fetches & parses each CSV
 * 4. Runs attribute generation (dict × CSV rows)
 *
 * @param {Object} distributionLd - The distribution LD from nanopubSkeleton
 * @param {string} npId - The nanopub ID (e.g. http://materialsmine.org/np/xxx)
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object[]>} Array of sample assertion nodes with sio:hasAttribute
 */
async function buildSddAttributes(distributionLd, npId, logger) {
  const { sddFile, csvFiles } = classifyDistributionFiles(distributionLd);

  if (!sddFile) {
    throw new Error(
      'No SDD file (.xlsx/.xls) found in distribution. An SDD file is required.'
    );
  }

  if (!csvFiles.length) {
    throw new Error(
      'No CSV/TSV file(s) found in distribution. At least one data file is required.'
    );
  }

  // 1. Fetch and parse the SDD XLSX via internal file access
  const sddUrl = sddFile['@id'];
  logger.info(`[sdd-serializer] Fetching SDD file: ${sddUrl}`);
  const sddStream = await fetchFileStream(sddUrl);
  const sddBuffer = await streamToBuffer(sddStream);
  const { dictRows, codeMappings } = parseDictSheet(sddBuffer);
  logger.info(
    `[sdd-serializer] Parsed ${dictRows.length} dictionary rows, ${codeMappings.size} code mappings from SDD`
  );

  if (!dictRows.length) {
    throw new Error(
      'SDD Dictionary Mapping sheet is empty. At least one mapping row is required.'
    );
  }

  // 2. Fetch and parse each CSV, filter to only data CSVs that match the SDD
  const allCsvRows = [];

  for (const csvFile of csvFiles) {
    const csvUrl = csvFile['@id'];
    const csvLabel = csvFile['rdfs:label'] || csvUrl;
    logger.info(`[sdd-serializer] Fetching CSV: ${csvLabel}`);

    const csvStream = await fetchFileStream(csvUrl);
    const csvRows = await parseCsvStream(csvStream);

    if (!csvRows.length) {
      logger.warn(`[sdd-serializer] Empty CSV, skipping: ${csvLabel}`);
      continue;
    }

    const csvHeaders = Object.keys(csvRows[0]);
    const { matched, unmatched } = matchDictToHeaders(dictRows, csvHeaders);

    if (matched === 0) {
      logger.info(
        `[sdd-serializer] Skipping ${csvLabel}: no headers match the SDD Dictionary`
      );
      continue;
    }

    if (unmatched.length) {
      logger.warn(
        `[sdd-serializer] ${csvLabel}: ${unmatched.length} SDD column(s) not found in CSV headers: ${unmatched.join(', ')}`
      );
    }

    logger.info(
      `[sdd-serializer] Parsed ${csvRows.length} rows from ${csvLabel} (${matched} columns matched)`
    );

    for (let i = 0; i < csvRows.length; i++) allCsvRows.push(csvRows[i]);
  }

  if (!allCsvRows.length) {
    throw new Error(
      'No CSV files match the SDD Dictionary columns. Check that CSV headers match the Column or Label values in the Dictionary Mapping.'
    );
  }

  logger.info(
    `[sdd-serializer] Total CSV rows: ${allCsvRows.length}, dict rows: ${dictRows.length}`
  );

  // 3. Resolve file references (file, url format columns)
  const distArr =
    distributionLd?.['mm:hasDistribution']?.['dcat:distribution'] || [];
  const distEntries = Array.isArray(distArr) ? distArr : [distArr];
  const resolvedCsvRows = await resolveFileReferences(
    allCsvRows,
    dictRows,
    distEntries,
    logger
  );

  return { allCsvRows: resolvedCsvRows, dictRows, codeMappings };
}

/**
 * Split CSV rows into batches and generate attributes for each batch.
 * @param {Object[]} allCsvRows - All parsed CSV rows
 * @param {Object[]} dictRows - Parsed dict rows from XLSX
 * @param {string} npId - Nanopub ID
 * @param {number} [batchSize] - Rows per batch
 * @returns {Object[][]} Array of batches, each an array of sample nodes
 */
function generateBatches(
  allCsvRows,
  dictRows,
  npId,
  batchSize = SDD_BATCH_SIZE,
  codeMappings = new Map()
) {
  const batches = [];
  for (let offset = 0; offset < allCsvRows.length; offset += batchSize) {
    const slice = allCsvRows.slice(offset, offset + batchSize);
    const samples = generateAttributes(
      slice,
      dictRows,
      npId,
      offset,
      codeMappings
    );
    batches.push(samples);
  }
  return batches;
}

module.exports = {
  buildSddAttributes,
  generateBatches,
  SDD_BATCH_SIZE,
  // Exported for testing
  classifyDistributionFiles,
  parseDictSheet,
  parseCodeMappingsSheet,
  resolveCodeMapping,
  generateAttributes,
  generateAttributeId,
  getInferredValues,
  matchKeys,
  matchDictToHeaders,
  resolveFileReferences,
  findDistributionEntry
};
