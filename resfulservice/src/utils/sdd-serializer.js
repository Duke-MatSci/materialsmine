'use strict';

const XLSX = require('xlsx');
const csv = require('csv-parser');
const minioClient = require('./minio');
const FileManager = require('./fileManager');
const { MinioBucket } = require('../../config/constant');
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
// Merged from serializer parser.ts + config/constant UNIT_IRI
const unitMap = {
  // From serializer
  '%': 'http://www.ontology-of-units-of-measure.org/resource/om-2/Percent',
  '1/s': 'http://www.ontology-of-units-of-measure.org/resource/om-2/PerSecond',
  'a/m^2':
    'http://www.ontology-of-units-of-measure.org/resource/om-2/AmperePerSquareMetre',
  c: 'http://www.ontology-of-units-of-measure.org/resource/om-2/Coulomb',
  'c/min':
    'http://www.ontology-of-units-of-measure.org/resource/om-2/CoulombPerMinute',
  celcius:
    'http://www.ontology-of-units-of-measure.org/resource/om-2/DegreeCelsius',
  celsius:
    'http://www.ontology-of-units-of-measure.org/resource/om-2/DegreeCelsius',
  'celsius/min':
    'http://www.ontology-of-units-of-measure.org/resource/om-2/DegreeCelsiusPerMinute',
  'celsius/minute':
    'http://www.ontology-of-units-of-measure.org/resource/om-2/DegreeCelsiusPerMinute',
  days: 'http://www.ontology-of-units-of-measure.org/resource/om-2/Day',
  nm: 'http://www.ontology-of-units-of-measure.org/resource/om-2/Nanometre',
  'mg/ml':
    'http://www.ontology-of-units-of-measure.org/resource/om-2/MilligramPerMillilitre',
  // From config/constant UNIT_IRI
  Celsius: 'http://qudt.org/vocab/unit/DEG_C',
  hours: 'http://qudt.org/vocab/unit/HR',
  hour: 'http://qudt.org/vocab/unit/HR',
  minutes: 'http://qudt.org/vocab/unit/MIN',
  minute: 'http://qudt.org/vocab/unit/MIN',
  kV: 'http://qudt.org/vocab/unit/KiloV',
  'g/cm^3': 'http://qudt.org/vocab/unit/GM-PER-CentiM3',
  'MV/cm': 'http://qudt.org/vocab/unit/MegaV-PER-CentiM',
  um: 'http://qudt.org/vocab/unit/MicroM',
  Hz: 'http://qudt.org/vocab/unit/HZ'
};

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
 * Match a dict label to a CSV row key (case-insensitive substring match).
 * Returns the first matching value or undefined.
 */
function matchKeys(label, row) {
  const needle = String(label).trim().toLowerCase();
  const key = Object.keys(row).find((k) =>
    k.trim().toLowerCase().includes(needle)
  );
  return key !== undefined ? row[key] : undefined;
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
  'wasGeneratedBy'
];

/**
 * Parse the Dictionary Mapping sheet from an XLSX buffer.
 * @param {Buffer} buffer - XLSX file contents
 * @returns {Object[]} Array of dict row objects
 */
function parseDictSheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[DICT_SHEET_NAME];
  if (!sheet) {
    throw new Error(
      `SDD file is missing the "${DICT_SHEET_NAME}" sheet.`
    );
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

  return dictRows;
}

/* ────────────────────── Attribute generation ────────────────── */

/**
 * Build attribute triples from CSV rows and dict definitions.
 * Ported from serializer linkDataGenerator with full DictRow field handling.
 *
 * @param {Object[]} csvRows - Parsed CSV row objects
 * @param {Object[]} dict - Parsed dict rows from XLSX
 * @param {string} npId - Nanopub ID (used to build sample IDs)
 * @param {number} fileOffset - Offset for sample numbering across multiple CSVs
 * @returns {Object[]} Array of sample assertion nodes
 */
function generateAttributes(csvRows, dict, npId, fileOffset) {
  const samples = [];

  csvRows.forEach((row, rowIndex) => {
    const sampleId = `${npId}/sample-${fileOffset + rowIndex + 1}`;
    const attributes = [];

    dict.forEach((d) => {
      const isInferred = d.column.startsWith('??');
      const value = matchKeys(d.label, row);

      if (value !== undefined || isInferred) {
        const attributeId = generateAttributeId(sampleId, d.column);
        const attr = { '@id': attributeId };

        // @type from attribute or entity
        const attrType = d.attribute || d.entity;
        if (attrType) attr['@type'] = attrType;

        // sio:hasValue — numeric as xsd:double, else string literal
        if (value !== undefined && value !== '') {
          attr['sio:hasValue'] = isNaN(Number(value))
            ? String(value)
            : { '@value': Number(value), '@type': 'xsd:double' };
        }

        // sio:hasRole
        if (d.role) attr['sio:hasRole'] = d.role;

        // sio:inRelationTo or custom relation
        if (d.inRelationTo) {
          const predicate = d.relation || 'sio:inRelationTo';
          attr[predicate] = getInferredValues(sampleId, d.inRelationTo);
        }

        // sio:hasAttribute (from attributeOf — nested attribute reference)
        if (d.attributeOf) {
          attr['sio:hasAttribute'] = getInferredValues(
            sampleId,
            d.attributeOf
          );
        }

        // sio:hasUnit
        if (d.unit) {
          const unitKey = d.unit.toLowerCase();
          attr['sio:hasUnit'] = [
            {
              ...(unitMap[unitKey] ? { '@type': unitMap[unitKey] } : {}),
              ...(unitMap[d.unit] ? { '@type': unitMap[d.unit] } : {}),
              '@value': d.unit
            }
          ];
        }

        // rdfs:comment
        if (d.comment) attr['rdfs:comment'] = d.comment;

        // skos:definition
        if (d.definition) attr['skos:definition'] = d.definition;

        // sio:hasFormat
        if (d.format) attr['sio:hasFormat'] = d.format;

        // sio:hasTimepoint (resolved as inferred value)
        if (d.time) {
          attr['sio:hasTimepoint'] = getInferredValues(sampleId, d.time);
        }

        // prov:wasDerivedFrom
        if (d.wasDerivedFrom) {
          attr['prov:wasDerivedFrom'] = getInferredValues(
            sampleId,
            d.wasDerivedFrom
          );
        }

        // prov:wasGeneratedBy
        if (d.wasGeneratedBy) {
          attr['prov:wasGeneratedBy'] = getInferredValues(
            sampleId,
            d.wasGeneratedBy
          );
        }

        attributes.push(attr);
      }
    });

    samples.push({
      '@id': sampleId,
      '@type': 'sio:SIO_001050',
      'sio:hasAttribute': attributes
    });
  });

  return samples;
}

/* ────────────────── Main: buildSddAttributes ────────────────── */

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
      'No CSV file(s) found in distribution. At least one CSV data file is required.'
    );
  }

  // 1. Fetch and parse the SDD XLSX via internal file access
  const sddUrl = sddFile['@id'];
  logger.info(`[sdd-serializer] Fetching SDD file: ${sddUrl}`);
  const sddStream = await fetchFileStream(sddUrl);
  const sddBuffer = await streamToBuffer(sddStream);
  const dictRows = parseDictSheet(sddBuffer);
  logger.info(
    `[sdd-serializer] Parsed ${dictRows.length} dictionary rows from SDD`
  );

  if (!dictRows.length) {
    throw new Error(
      'SDD Dictionary Mapping sheet is empty. At least one mapping row is required.'
    );
  }

  // 2. Fetch and parse each CSV, generate attributes
  const allSamples = [];
  let fileOffset = 0;

  for (const csvFile of csvFiles) {
    const csvUrl = csvFile['@id'];
    const csvLabel = csvFile['rdfs:label'] || csvUrl;
    logger.info(`[sdd-serializer] Fetching CSV: ${csvLabel}`);

    const csvStream = await fetchFileStream(csvUrl);

    const csvRows = await parseCsvStream(csvStream);
    logger.info(
      `[sdd-serializer] Parsed ${csvRows.length} rows from ${csvLabel}`
    );

    const samples = generateAttributes(csvRows, dictRows, npId, fileOffset);
    allSamples.push(...samples);
    fileOffset += csvRows.length;
  }

  logger.info(
    `[sdd-serializer] Generated ${allSamples.length} sample nodes total`
  );
  return allSamples;
}

module.exports = {
  buildSddAttributes,
  // Exported for testing
  classifyDistributionFiles,
  parseDictSheet,
  generateAttributes,
  generateAttributeId,
  getInferredValues,
  matchKeys,
  unitMap
};
