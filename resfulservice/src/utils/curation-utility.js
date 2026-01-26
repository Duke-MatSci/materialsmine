/* eslint-disable space-before-function-paren */
// https://github.com/prettier/prettier/issues/3847
const { default: axios } = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const readXlsxFile = require('read-excel-file/node');
const decompress = require('decompress');
const Xmljs = require('xml-js');
const validator = require('xsd-schema-validator');
const GenerateSchema = require('generate-schema');
const { jsonSchema2xsd } = require('xsdlibrary');
const csv = require('csv-parser');
const { spawn } = require('child_process');
const { deleteFile, deleteFolder } = require('../utils/fileManager');
const { UNIT_IRI } = require('../../config/constant');

exports.xlsxFileReader = async (path, sheetName) => {
  try {
    const sheetData = await readXlsxFile(path, { sheet: sheetName });
    return sheetData;
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
};

exports.isTifFile = (path) => /(?=.*?(.tiff?))/.test(path);

exports.xmlGenerator = (curationObject) => {
  return Xmljs.json2xml(curationObject, {
    compact: true,
    spaces: 2,
    ignoreDeclaration: false
  });
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

exports.parseCSV = async (filename, dataStream, isMetamine) => {
  return new Promise((resolve, reject) => {
    const jsonData = [];
    let fileStream;

    const isTsv = /(?=.*?(.tsv)$)/.test(filename);

    let options = {
      mapHeaders: ({ header, index }) =>
        header === '' ? `field${index + 1}` : header,
      quote: ''
    };

    if (isMetamine) options.quote = '"';

    options = isTsv ? { ...options, separator: '\t' } : options;

    if (filename) {
      fileStream = fs.createReadStream(filename);
    } else {
      fileStream = dataStream;
    }

    fileStream
      .pipe(csv(options))
      .on('data', (data) => jsonData.push(data))
      .on('end', () => {
        resolve(jsonData);
      })
      .on('error', reject);
  });
};

exports.generateCSVData = (data, req) => {
  req.logger.info('curation-utility.generateCSVData - Function Entry:');
  const headers = data?.headers ?? data?.data ?? data;
  const rows = data?.rows ?? data?.data ?? data;
  const dataHeaders = headers.column.map(({ _text }) => _text);
  const dataRows = rows.row.map(({ column }) => {
    return column.map(({ _text }) => _text);
  });

  const csvData = [[dataHeaders], ...dataRows]
    .map((arr) => arr.join(','))
    .join('\r\n');

  const filename = `processed-${Math.floor(
    100000000 + Math.random() * 900000000
  )}.csv`;
  const filePath = `mm_files/${filename}`;

  fs.writeFile(filePath, csvData, (err) => {
    if (err) console.error(err);
  });

  return `/api/files/${filename}?isFileStore=true`;
};

exports.parseXSDFile = async (req, filename) => {
  req.logger.info('curation-utility.parseXSDFile - Function Entry:');
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

        if (
          chooseParameter.test(line) &&
          !new RegExp(maxOccurs, 'gm').test(line)
        ) {
          const lineArray = line.split('<xs:element');
          const modifiedLine = [
            lineArray[0],
            '<xs:element ',
            'minOccurs="0"',
            ' ',
            maxOccurs,
            lineArray[1]
          ].join('');
          writeStream.write(`${modifiedLine}\r\n`);
        } else if (regex.test(line) && !root.test(line)) {
          const lineArray = line.split('<xs:element');
          const modifiedLine = [
            lineArray[0],
            '<xs:element ',
            'minOccurs="0"',
            lineArray[1]
          ].join('');
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
  logger.info('curation-utility.unZipFolder - Function Entry:');
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

exports.readFolder = (folderPath, logger) => {
  logger.info('curation-utility.readFolder - Function Entry:');
  const folderContent = fs.readdirSync(folderPath).map((fileName) => {
    return path.join(folderPath, fileName);
  });

  const isFolder = (fileName) => {
    return (
      fs.lstatSync(fileName).isDirectory() &&
      fileName.split('/').pop() !== '__MACOSX'
    );
  };

  const isFile = (fileName) => {
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

// Extract bare DOI (e.g., "10.1063/1.3487275") from either a bare DOI or a full DOI URL
function extractBareDOI(doiLike) {
  if (!doiLike) return null;
  let s = String(doiLike).trim();
  s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  return s || null;
}

// Normalize to canonical doi.org IRI
function toDoiIri(doiLike) {
  const bare = extractBareDOI(doiLike);
  return bare ? `https://doi.org/${bare}` : null;
}

/**
 * Fetch paper details from OpenAlex using a DOI.
 * If anything fails, returns null to keep the ETL resilient.
 */
async function fetchPaperDetails(doiBare, logger) {
  if (!doiBare) return null;
  const url = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(
    doiBare
  )}`;
  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    return data || null;
  } catch (error) {
    logger.error(`[OpenAlex fetchPaperDetails]: ${JSON.stringify(error)}`);
    return null;
  }
}

function parseExplorerUrl(rawUrl) {
  const url = new URL(rawUrl);

  // last path segment holds the ID
  const id = url.pathname.split('/').filter(Boolean).pop();

  // read query params; convert to boolean if provided
  const isNewParam = url.searchParams.get('isNewCuration');
  const isNewCuration = isNewParam === null ? undefined : isNewParam === 'true';

  return { id, isNewCuration };
}

function slug(s, fallback = 'item') {
  const out = String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return out || fallback;
}

async function getText(maybeUrlOrXml) {
  if (typeof maybeUrlOrXml !== 'string') {
    throw new Error('XML must be a string or URL');
  }
  if (/^https?:\/\//i.test(maybeUrlOrXml)) {
    const { id, isNewCuration } = parseExplorerUrl(maybeUrlOrXml);
    const payload = {
      query: `
      query XmlViewer($input: xmlViewerInput) {
        xmlViewer(input: $input) { id xmlString }
      }
    `,
      variables: {
        input: { id, isNewCuration }
      }
    };

    const graphqlClient = axios.create({
      baseURL: process.env.GRAPHQL_ORIGIN || 'http://127.0.0.1:3001',
      headers: { 'Content-Type': 'application/json' }
    });

    const { data, errors } = await graphqlClient.post('/graphql', payload);
    if (errors) {
      throw new Error(`GraphQL errors: ${String(errors)}`);
    }
    return {
      id: data?.data?.xmlViewer?.id || '',
      rawXml: data?.data?.xmlViewer?.xmlString || ''
    };
  }

  return { rawXml: maybeUrlOrXml };
}

const hasText = (s) => s != null && String(s).trim().length > 0;

// Extract helper for blob id if your File is like "http://...blob?id=XYZ"
const extractBlobId = (s) => {
  if (!hasText(s)) return null;
  try {
    // if the string is absolute URL, the base will be ignored
    const real = new URL(String(s));
    return real.searchParams.get('id') || String(s);
  } catch {
    // not a full URL; try to parse `...?id=...` manually
    const m = String(s).match(/[?&]id=([^&#]+)/);
    return m ? decodeURIComponent(m[1]) : String(s);
  }
};

// function pick(obj, path, fallback = undefined) {
//   try {
//     return (
//       path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj) ??
//       fallback
//     );
//   } catch {
//     return fallback;
//   }
// }

function pick(obj, path, fallback = undefined) {
  try {
    return (
      path.split('.').reduce((o, k) => {
        if (o == null) return undefined;

        // Find the actual key in the current object level that matches 'k' case-insensitively
        const target = k.toLowerCase();
        const actualKey = Object.keys(o).find(
          (key) => key.toLowerCase() === target
        );

        return actualKey ? o[actualKey] : undefined;
      }, obj) ?? fallback
    );
  } catch {
    return fallback;
  }
}

const toArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const asDecimal = (v) =>
  v == null || v === '' ? undefined : Number.isFinite(+v) ? +v : undefined;
const mapUnit = (u) => (u ? UNIT_IRI[String(u).trim()] || null : null);

/* ------------------------ Value helpers ------------------------ */
const litStr = (v) =>
  v == null ? null : { '@value': String(v), '@type': 'xsd:string' };

const litNum = (v) => {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? { '@value': n, '@type': 'xsd:double' } : null;
};

/* ---------- helper: dataset/table helper ---------- */
function buildSioDatasetFromTable(table, datasetId, desc = null) {
  if (!table) return null;

  // Extract text from xml2js-style nodes: { _: 'value', $: { id: '0' } }
  const textOf = (val) => {
    if (val == null) return null;
    if (typeof val === 'object') {
      if (Object.prototype.hasOwnProperty.call(val, '_')) return val._;
      if (Object.prototype.hasOwnProperty.call(val, 'value')) return val.value;
      if (Object.prototype.hasOwnProperty.call(val, 'text')) return val.text;
      return null;
    }
    return val;
  };

  // Normalize a list of nodes into { id?, idx, text }, sorted by numeric id if all present
  const normItems = (list) => {
    const arr = toArray(list);
    const mapped = arr.map((v, idx) => ({
      id:
        v && typeof v === 'object' && v.$ && v.$.id != null
          ? Number(v.$.id)
          : null,
      idx,
      text: textOf(v)
    }));
    if (mapped.length && mapped.every((m) => Number.isFinite(m.id))) {
      mapped.sort((a, b) => a.id - b.id);
    }
    return mapped;
  };

  // -------- headers ----------
  let headers = [];
  const headerItems = normItems(pick(table, 'headers.column'));
  if (headerItems.length) {
    headers = headerItems
      .map((h) => h.text)
      .filter(hasText)
      .map(String);
  } else {
    const headerFallback = normItems(pick(table, 'headers'));
    const alt = headerFallback
      .map((h) => h.text)
      .filter(hasText)
      .map(String);
    if (alt.length) headers = alt;
  }

  // -------- rows ----------
  let rows = toArray(pick(table, 'rows.row'));
  if (!rows.length) rows = toArray(pick(table, 'rows'));

  const parts = [];
  rows.forEach((row) => {
    // Prefer explicit <column> children; otherwise treat row as a plain list
    let cols = normItems(pick(row, 'column'));
    if (!cols.length) cols = normItems(row);

    const attrs = [];
    cols.forEach((c, i) => {
      const label =
        headers[i] != null && hasText(headers[i])
          ? String(headers[i])
          : `column ${i + 1}`;
      const raw = c.text;
      if (raw == null || raw === '') return;

      const vLit = litNum(raw) || litStr(raw);
      if (!vLit) return;

      attrs.push({
        '@type': 'sio:attribute',
        'rdfs:label': label,
        'sio:hasValue': vLit
      });
    });

    if (attrs.length) {
      parts.push({
        '@type': 'sio:row',
        'sio:hasAttribute': attrs
      });
    }
  });

  // Optional dataset description
  const commentRaw =
    desc ?? pick(table, 'description') ?? pick(table, 'Description');
  // const commentRaw = pick(table, 'description') ?? pick(table, 'Description');
  const comment = textOf(commentRaw);

  if (!parts.length && !hasText(comment)) return null;

  return {
    '@id': datasetId,
    '@type': 'sio:dataset',
    ...(hasText(comment) ? { 'rdfs:comment': String(comment) } : {}),
    ...(parts.length ? { 'sio:hasPart': parts } : {})
  };
}

/* ---------- helper: normalize potentially quoted XML ---------- */
function normalizeXml(xml) {
  if (xml == null) return xml;
  let s = String(xml);
  // strip UTF-8 BOM
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  // if entire payload is wrapped in the SAME quote char, unwrap once
  const first = s[0];
  const last = s[s.length - 1];
  if ((first === '\'' && last === '\'') || (first === '"' && last === '"')) {
    const inner = s.slice(1, -1);
    if (inner.includes('<') && inner.includes('>')) s = inner;
  }
  return s;
}

/* ------------------------ XSD validation (Java → xmllint fallback) ------------------------ */
function validateWithJava(tmp, xmlString, xsdUrl) {
  return new Promise((resolve) => {
    const xml = normalizeXml(xmlString);

    validator.validateXML(xml, xsdUrl, (err, result) => {
      if (
        err &&
        /unsupported <xml> parameter/i.test(String(err.message || err))
      ) {
        // Retry using a temp file
        fs.writeFile(tmp, xml, 'utf8', (werr) => {
          if (werr) return resolve({ ok: false, errors: [String(werr)] });
          validator.validateXML({ file: tmp }, xsdUrl, (e2, res2) => {
            fs.unlink(tmp, () => {});
            if (e2) {
              return resolve({ ok: false, errors: [String(e2.message || e2)] });
            }
            resolve({ ok: !!res2.valid, errors: res2.messages || [] });
          });
        });
        return;
      }
      if (err) {
        return resolve({ ok: false, errors: [String(err.message || err)] });
      }
      resolve({ ok: !!result.valid, errors: result.messages || [] });
    });
  });
}

/* ---------- xmllint fallback (pipe normalized XML) ---------- */
function validateWithXmllint(xmlString, xsdUrl) {
  return new Promise((resolve) => {
    const xml = normalizeXml(xmlString);
    let stderr = '';
    let child;
    try {
      child = spawn('xmllint', ['--noout', '--schema', xsdUrl, '-']);
    } catch (e) {
      return resolve({
        ok: false,
        errors: ['xmllint not available', String(e.message || e)]
      });
    }
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => {
      if (code === 0) resolve({ ok: true, errors: [] });
      else {
        resolve({
          ok: false,
          errors: (stderr || 'xmllint validation failed')
            .split('\n')
            .filter(Boolean)
        });
      }
    });
    child.stdin.write(xml);
    child.stdin.end();
  });
}

/* ---------- orchestrator (unchanged signature, now normalizes) ---------- */
async function validateXmlAgainstXsd(TMP_DIRECTORY, xmlString, xsdUrl) {
  const javaResult = await validateWithJava(TMP_DIRECTORY, xmlString, xsdUrl);
  if (javaResult.ok) return javaResult;

  const msg = (javaResult.errors || []).join(' ');
  if (
    /ENOENT|spawn\s+java|Could not find|No such file|unsupported <xml>/i.test(
      msg
    )
  ) {
    const xl = await validateWithXmllint(xmlString, xsdUrl);
    if (xl.ok) return xl;
    return {
      ok: false,
      errors: ['XSD validation failed (Java + xmllint).', ...xl.errors]
    };
  }
  return {
    ok: false,
    errors: ['XSD validation failed (Java).', ...javaResult.errors]
  };
}

// async function validateXmlAgainstXsd(TMP_DIRECTORY, xmlString, xsdUrl) {
//   const javaResult = await validateWithJava(TMP_DIRECTORY, xmlString, xsdUrl);
//   if (javaResult.ok) return javaResult;

//   const msg = (javaResult.errors || []).join(' ');
//   if (/ENOENT|spawn\s+java|Could not find|No such file/i.test(msg)) {
//     const xl = await validateWithXmllint(xmlString, xsdUrl);
//     if (xl.ok) return xl;
//     return {
//       ok: false,
//       errors: ['XSD validation failed (Java + xmllint).', ...xl.errors]
//     };
//   }
//   return {
//     ok: false,
//     errors: ['XSD validation failed (Java).', ...javaResult.errors]
//   };
// }

// function prepareForValidation(doc) {
//   // Accept either stringified JSON-LD or object
//   const clone =
//     typeof doc === 'string' ? JSON.parse(doc) : JSON.parse(JSON.stringify(doc));

//   // Helper: ensure explicit @value/@type
//   const ensureTypedValue = (val) => {
//     if (val == null) return null;
//     if (typeof val === 'object' && '@value' in val) return val;
//     if (typeof val === 'number')
//       return { '@value': val, '@type': 'xsd:double' };
//     const n = Number(val);
//     if (Number.isFinite(n) && String(val).trim() !== '') {
//       return { '@value': n, '@type': 'xsd:double' };
//     }
//     return { '@value': String(val), '@type': 'xsd:string' };
//   };

//   // Helper: normalize unit to IRI (unit:*) when possible
//   const toUnitIri = (u) => {
//     if (!u) return null;
//     // already curie or absolute IRI
//     if (
//       typeof u === 'string' &&
//       (u.startsWith('unit:') || /^https?:\/\//i.test(u))
//     ) {
//       return u;
//     }
//     return UNIT_IRI[String(u).trim()] || null;
//   };

//   // Walk all graphs/nodes
//   for (const g of clone['@graph'] ?? []) {
//     for (const n of g['@graph'] ?? []) {
//       // 1) Legacy 'hasUnit' → normalize to 'sio:hasUnit'
//       if (n.hasUnit) {
//         const unitIri = toUnitIri(n.hasUnit);
//         if (unitIri) n['sio:hasUnit'] = unitIri;
//         else n['sio:hasUnit'] = String(n.hasUnit);
//         delete n.hasUnit;
//       }

//       // 2) If 'sio:hasUnit' is a raw literal we can map, map it
//       if (n['sio:hasUnit'] && typeof n['sio:hasUnit'] === 'string') {
//         const mapped = toUnitIri(n['sio:hasUnit']);
//         if (mapped) n['sio:hasUnit'] = mapped;
//       }

//       // 3) Legacy 'hasValue' → normalize to 'sio:hasValue' with explicit typing
//       if (n.hasValue != null) {
//         n['sio:hasValue'] = ensureTypedValue(n.hasValue);
//         delete n.hasValue;
//       } else if (n['sio:hasValue'] != null) {
//         // Ensure explicit typing even when already present but primitive
//         if (
//           typeof n['sio:hasValue'] !== 'object' ||
//           !('@value' in n['sio:hasValue'])
//         ) {
//           n['sio:hasValue'] = ensureTypedValue(n['sio:hasValue']);
//         }
//       }

//       // 4) Clean up non-shape fields if needed
//       // (Kept from your original; safe to keep)
//       delete n.countsByYear;

//       // 5) Normalize schema:publication → journal node if still present
//       if (n['schema:publication'] && !n.journal) {
//         const j = n['schema:publication'];
//         n.journal = {
//           id: `mm:journal/${String(j).toLowerCase().replace(/\W+/g, '-')}`,
//           type: 'schema:Periodical',
//           'schema:name': j
//         };
//         delete n['schema:publication'];
//       }

//       // 6) If any primaryLocation id starts with doi:, normalize
//       if (n.primaryLocation?.id?.startsWith?.('doi:')) {
//         const doi = n.primaryLocation.id.replace(/^doi:/, '');
//         n.primaryLocation.id = `https://doi.org/${doi}`;
//       }
//     }
//   }

//   return clone;
// }
function prepareForValidation(doc) {
  const clone =
    typeof doc === 'string' ? JSON.parse(doc) : JSON.parse(JSON.stringify(doc));

  const UNIT_MAP = { nm: 'unit:NanoM', Hz: 'unit:HZ' /* extend as needed */ };

  // helper: recursively normalize unit strings to IRIs for both hasUnit and sio:hasUnit
  const normalizeUnitsDeep = (node) => {
    if (!node || typeof node !== 'object') return;
    // normalize legacy keys
    if (typeof node.hasUnit === 'string') {
      node.hasUnit = UNIT_MAP[node.hasUnit] || node.hasUnit;
    }
    if (typeof node['sio:hasUnit'] === 'string') {
      node['sio:hasUnit'] =
        UNIT_MAP[node['sio:hasUnit']] || node['sio:hasUnit'];
    }
    // recurse
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach(normalizeUnitsDeep);
      else if (v && typeof v === 'object') normalizeUnitsDeep(v);
    }
  };

  for (const g of clone['@graph'] ?? []) {
    for (const n of g['@graph'] ?? []) {
      normalizeUnitsDeep(n);

      // ScholarlyArticle adjustments (unchanged)
      if (
        n['@type'] === 'schema:ScholarlyArticle' &&
        n.primaryLocation?.id?.startsWith('doi:')
      ) {
        const doi = n.primaryLocation.id.replace(/^doi:/, '');
        n.primaryLocation.id = `https://doi.org/${doi}`;
      }
      delete n.countsByYear;

      if (n['schema:publication'] && !n.journal) {
        const j = n['schema:publication'];
        n.journal = {
          '@id': `mm:journal/${j.toLowerCase().replace(/\W+/g, '-')}`,
          '@type': 'schema:Periodical',
          'schema:name': j
        };
        delete n['schema:publication'];
      }
    }
  }

  return clone;
}

module.exports = {
  extractBareDOI,
  toDoiIri,
  fetchPaperDetails,
  pick,
  litStr,
  litNum,
  toArray,
  mapUnit,
  asDecimal,
  slug,
  getText,
  hasText,
  extractBlobId,
  normalizeXml,
  validateXmlAgainstXsd,
  prepareForValidation,
  buildSioDatasetFromTable
};
