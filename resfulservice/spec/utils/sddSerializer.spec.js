'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const XLSX = require('xlsx');
const { logger } = require('../common/utils');

const {
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
  findDistributionEntry,
  generateBatches
} = require('../../src/utils/sdd-serializer');

/* Helpers */
function makeDictRow(overrides = {}) {
  return {
    column: '',
    label: '',
    comment: '',
    definition: '',
    attribute: '',
    attributeOf: '',
    unit: '',
    format: '',
    time: '',
    entity: '',
    role: '',
    relation: '',
    inRelationTo: '',
    wasDerivedFrom: '',
    wasGeneratedBy: '',
    template: '',
    ...overrides
  };
}

function buildSddXlsx(dictRows, codeMappingRows) {
  const wb = XLSX.utils.book_new();

  const dictHeader = [
    'Column',
    'Label',
    'Comment',
    'Definition',
    'Attribute',
    'attributeOf',
    'Unit',
    'Format',
    'Time',
    'Entity',
    'Role',
    'Relation',
    'inRelationTo',
    'wasDerivedFrom',
    'wasGeneratedBy',
    'Template'
  ];
  const dictData = [dictHeader, ...dictRows];
  const dictSheet = XLSX.utils.aoa_to_sheet(dictData);
  XLSX.utils.book_append_sheet(wb, dictSheet, 'Dictionary Mapping');

  if (codeMappingRows) {
    const cmHeader = ['Code', 'URI', 'Label'];
    const cmData = [cmHeader, ...codeMappingRows];
    const cmSheet = XLSX.utils.aoa_to_sheet(cmData);
    XLSX.utils.book_append_sheet(wb, cmSheet, 'Code Mappings');
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

describe('SDD Serializer', function () {
  afterEach(() => sinon.restore());

  // generateAttributeId
  describe('generateAttributeId', function () {
    it('should generate a deterministic id from sample and column', function () {
      const id = generateAttributeId(
        'http://example.org/sample-1',
        'Grain Size'
      );
      expect(id).to.equal('http://example.org/sample-1/data/grain-size');
    });

    it('should strip ?? prefix from inferred columns', function () {
      const id = generateAttributeId(
        'http://example.org/sample-1',
        '??Measurement'
      );
      expect(id).to.equal('http://example.org/sample-1/data/measurement');
    });

    it('should lowercase the column name', function () {
      const id = generateAttributeId('s1', 'TEMPERATURE');
      expect(id).to.equal('s1/data/temperature');
    });
  });

  // getInferredValues
  describe('getInferredValues', function () {
    it('should return undefined for empty value', function () {
      expect(getInferredValues('s1', '')).to.be.undefined;
      expect(getInferredValues('s1', null)).to.be.undefined;
      expect(getInferredValues('s1', undefined)).to.be.undefined;
    });

    it('should return prefixed IRI as-is when value contains colon', function () {
      expect(getInferredValues('s1', 'sio:Sample')).to.equal('sio:Sample');
    });

    it('should return an @id array for local column references', function () {
      const result = getInferredValues('http://ex.org/s1', 'Temperature');
      expect(result).to.deep.equal([
        { '@id': 'http://ex.org/s1/data/temperature' }
      ]);
    });
  });

  // matchKeys
  describe('matchKeys', function () {
    const row = { 'Grain Size': '50', Temperature: '25', Solvent: 'Water' };

    it('should match by column name (case-insensitive)', function () {
      expect(matchKeys('grain size', '', row)).to.equal('50');
      expect(matchKeys('TEMPERATURE', '', row)).to.equal('25');
    });

    it('should fall back to label if column does not match', function () {
      expect(matchKeys('gs', 'Grain Size', row)).to.equal('50');
    });

    it('should return undefined when neither column nor label match', function () {
      expect(matchKeys('missing', 'also_missing', row)).to.be.undefined;
    });

    it('should return empty string for empty cell values', function () {
      const rowWithEmpty = { 'Grain Size': '', Temperature: '25' };
      expect(matchKeys('Grain Size', '', rowWithEmpty)).to.equal('');
    });
  });

  // matchDictToHeaders
  describe('matchDictToHeaders', function () {
    const headers = ['Grain Size', 'Temperature', 'Solvent'];

    it('should count matched columns', function () {
      const dict = [
        makeDictRow({ column: 'Grain Size' }),
        makeDictRow({ column: 'Temperature' }),
        makeDictRow({ column: 'Missing' })
      ];
      const { matched, unmatched } = matchDictToHeaders(dict, headers);
      expect(matched).to.equal(2);
      expect(unmatched).to.deep.equal(['Missing']);
    });

    it('should skip inferred columns (??prefix)', function () {
      const dict = [
        makeDictRow({ column: 'Grain Size' }),
        makeDictRow({ column: '??Measurement' })
      ];
      const { matched, unmatched } = matchDictToHeaders(dict, headers);
      expect(matched).to.equal(1);
      expect(unmatched).to.be.empty;
    });

    it('should match by label as fallback', function () {
      const dict = [makeDictRow({ column: 'gs', label: 'Grain Size' })];
      const { matched } = matchDictToHeaders(dict, headers);
      expect(matched).to.equal(1);
    });

    it('should be case-insensitive', function () {
      const dict = [makeDictRow({ column: 'grain size' })];
      const { matched } = matchDictToHeaders(dict, headers);
      expect(matched).to.equal(1);
    });
  });

  // classifyDistributionFiles
  describe('classifyDistributionFiles', function () {
    it('should classify xlsx as SDD and csv as data file', function () {
      const dist = {
        'mm:hasDistribution': {
          'dcat:distribution': [
            { '@id': 'http://ex/sdd.xlsx', 'rdfs:label': 'my-sdd.xlsx' },
            { '@id': 'http://ex/data.csv', 'rdfs:label': 'data.csv' },
            { '@id': 'http://ex/img.png', 'rdfs:label': 'image.png' }
          ]
        }
      };
      const { sddFile, csvFiles } = classifyDistributionFiles(dist);
      expect(sddFile['@id']).to.equal('http://ex/sdd.xlsx');
      expect(csvFiles).to.have.length(1);
      expect(csvFiles[0]['@id']).to.equal('http://ex/data.csv');
    });

    it('should handle single distribution entry (not an array)', function () {
      const dist = {
        'mm:hasDistribution': {
          'dcat:distribution': {
            '@id': 'http://ex/sdd.xlsx',
            'rdfs:label': 'file.xlsx'
          }
        }
      };
      const { sddFile, csvFiles } = classifyDistributionFiles(dist);
      expect(sddFile).to.not.be.null;
      expect(csvFiles).to.have.length(0);
    });

    it('should handle tsv as CSV type', function () {
      const dist = {
        'mm:hasDistribution': {
          'dcat:distribution': [
            { '@id': 'http://ex/data.tsv', 'rdfs:label': 'data.tsv' }
          ]
        }
      };
      const { csvFiles } = classifyDistributionFiles(dist);
      expect(csvFiles).to.have.length(1);
    });

    it('should return null sddFile and empty csvFiles when no distribution', function () {
      const { sddFile, csvFiles } = classifyDistributionFiles({});
      expect(sddFile).to.be.null;
      expect(csvFiles).to.be.empty;
    });
  });

  // findDistributionEntry
  describe('findDistributionEntry', function () {
    const entries = [
      {
        '@id': 'http://ex/file/abc',
        'rdfs:label':
          'fantastic_chimpanzee-2026-10-01T17:25:42.847Z-example.png'
      },
      { '@id': 'http://ex/file/xyz', 'rdfs:label': 'report.csv' }
    ];

    it('should match by suffix after mangled prefix', function () {
      const entry = findDistributionEntry('example.png', entries);
      expect(entry['@id']).to.equal('http://ex/file/abc');
    });

    it('should match exact label', function () {
      const entry = findDistributionEntry('report.csv', entries);
      expect(entry['@id']).to.equal('http://ex/file/xyz');
    });

    it('should be case-insensitive', function () {
      const entry = findDistributionEntry('EXAMPLE.PNG', entries);
      expect(entry['@id']).to.equal('http://ex/file/abc');
    });

    it('should return undefined when no match', function () {
      const entry = findDistributionEntry('missing.jpg', entries);
      expect(entry).to.be.undefined;
    });
  });

  // resolveFileReferences
  describe('resolveFileReferences', function () {
    it('should replace file-format cells with __fileRef objects', async function () {
      const csvRows = [{ Datafile: 'example.png', Temperature: '25' }];
      const dict = [
        makeDictRow({
          column: 'Datafile',
          format: 'file',
          attribute: 'schema:ImageObject'
        }),
        makeDictRow({ column: 'Temperature', attribute: 'sio:Temperature' })
      ];
      const distEntries = [
        {
          '@id': 'http://ex/file/abc',
          'rdfs:label': 'mangled-prefix-2026-example.png'
        }
      ];

      const result = await resolveFileReferences(
        csvRows,
        dict,
        distEntries,
        logger
      );
      expect(result[0].Temperature).to.equal('25');
      expect(result[0].Datafile).to.have.property('__fileRef', true);
      expect(result[0].Datafile.files[0].url).to.equal('http://ex/file/abc');
      expect(result[0].Datafile.files[0].name).to.equal('example.png');
      expect(result[0].Datafile.files[0].schemaType).to.equal(
        'schema:ImageObject'
      );
    });

    it('should skip empty cells', async function () {
      const csvRows = [{ Datafile: '', Temperature: '25' }];
      const dict = [makeDictRow({ column: 'Datafile', format: 'file' })];
      const result = await resolveFileReferences(csvRows, dict, [], logger);
      expect(result[0].Datafile).to.equal('');
    });

    it('should skip when file not found in distribution entries', async function () {
      const csvRows = [{ Datafile: 'missing.png' }];
      const dict = [makeDictRow({ column: 'Datafile', format: 'file' })];
      const result = await resolveFileReferences(csvRows, dict, [], logger);
      expect(result[0].Datafile).to.equal('missing.png');
    });

    it('should return rows unchanged when no file-format columns exist', async function () {
      const csvRows = [{ Temperature: '25' }];
      const dict = [makeDictRow({ column: 'Temperature' })];
      const result = await resolveFileReferences(csvRows, dict, [], logger);
      expect(result).to.deep.equal(csvRows);
    });

    it('should not mutate original rows', async function () {
      const original = [{ Datafile: 'example.png' }];
      const dict = [makeDictRow({ column: 'Datafile', format: 'file' })];
      const distEntries = [
        { '@id': 'http://ex/f', 'rdfs:label': 'prefix-example.png' }
      ];
      await resolveFileReferences(original, dict, distEntries, logger);
      expect(original[0].Datafile).to.equal('example.png');
    });
  });

  // parseDictSheet
  describe('parseDictSheet', function () {
    it('should parse dictionary rows from XLSX buffer', function () {
      const buf = buildSddXlsx([
        [
          'Grain Size',
          'GS',
          'size of grains',
          '',
          'sio:Width',
          '??Measurement',
          'nm'
        ],
        ['Temperature', '', '', '', 'sio:Temperature', '', 'celsius']
      ]);
      const { dictRows } = parseDictSheet(buf);
      expect(dictRows).to.have.length(2);
      expect(dictRows[0].column).to.equal('Grain Size');
      expect(dictRows[0].label).to.equal('GS');
      expect(dictRows[0].comment).to.equal('size of grains');
      expect(dictRows[0].attribute).to.equal('sio:Width');
      expect(dictRows[0].attributeOf).to.equal('??Measurement');
      expect(dictRows[0].unit).to.equal('nm');
    });

    it('should default label to column when label is empty', function () {
      const buf = buildSddXlsx([
        ['Temperature', '', '', '', 'sio:Temperature']
      ]);
      const { dictRows } = parseDictSheet(buf);
      expect(dictRows[0].label).to.equal('Temperature');
    });

    it('should skip rows with empty column', function () {
      const buf = buildSddXlsx([
        ['Temperature', '', '', '', 'sio:Temperature'],
        ['', '', '', '', '']
      ]);
      const { dictRows } = parseDictSheet(buf);
      expect(dictRows).to.have.length(1);
    });

    it('should throw if Dictionary Mapping sheet is missing', function () {
      const wb = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([['dummy']]);
      XLSX.utils.book_append_sheet(wb, sheet, 'WrongName');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      expect(() => parseDictSheet(buf)).to.throw(
        'missing the "Dictionary Mapping" sheet'
      );
    });

    it('should parse Code Mappings sheet alongside dictionary', function () {
      const buf = buildSddXlsx(
        [['Temperature', '', '', '', 'sio:Temperature', '', 'degC']],
        [
          [
            'degC',
            'http://www.ontology-of-units-of-measure.org/resource/om-2/DegreeCelsius',
            'degree Celsius'
          ]
        ]
      );
      const { codeMappings } = parseDictSheet(buf);
      expect(codeMappings.size).to.equal(1);
      expect(codeMappings.get('degc').uri).to.equal(
        'http://www.ontology-of-units-of-measure.org/resource/om-2/DegreeCelsius'
      );
    });
  });

  // resolveCodeMapping
  describe('resolveCodeMapping', function () {
    it('should resolve from code mappings first', function () {
      const cm = new Map([['µm²', { uri: 'http://ex/um2', label: '' }]]);
      expect(resolveCodeMapping('µm²', cm)).to.equal('http://ex/um2');
    });

    it('should fall back to UNIT_IRI when not in code mappings', function () {
      const cm = new Map();
      const result = resolveCodeMapping('nm', cm);
      expect(result).to.include('om-2');
    });

    it('should return undefined for unknown units', function () {
      const cm = new Map();
      expect(resolveCodeMapping('parsecs', cm)).to.be.undefined;
    });

    it('should return undefined for empty input', function () {
      expect(resolveCodeMapping('', new Map())).to.be.undefined;
      expect(resolveCodeMapping(null, new Map())).to.be.undefined;
    });
  });

  // generateAttributes
  describe('generateAttributes', function () {
    const npId = 'http://materialsmine.org/np/test123';

    context('attribute-only mode (no entity rows)', function () {
      it('should wrap all attributes under a SIO_001050 sample node', function () {
        const dict = [
          makeDictRow({ column: 'Temperature', attribute: 'sio:Temperature' }),
          makeDictRow({ column: 'Pressure', attribute: 'sio:Pressure' })
        ];
        const csvRows = [{ Temperature: '25', Pressure: '101' }];

        const result = generateAttributes(csvRows, dict, npId, 0);
        expect(result).to.have.length(1);
        expect(result[0]['@type']).to.equal('sio:SIO_001050');
        expect(result[0]['sio:hasAttribute']).to.have.length(2);
      });

      it('should set sio:hasValue as number for numeric values', function () {
        const dict = [
          makeDictRow({ column: 'Temp', attribute: 'sio:Temperature' })
        ];
        const csvRows = [{ Temp: '25.5' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['sio:hasValue']).to.deep.equal({
          '@value': 25.5,
          '@type': 'xsd:double'
        });
      });

      it('should set sio:hasValue as string for non-numeric values', function () {
        const dict = [
          makeDictRow({ column: 'Solvent', attribute: 'sio:Descriptor' })
        ];
        const csvRows = [{ Solvent: 'Water' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['sio:hasValue']).to.equal('Water');
      });

      it('should skip attributes with empty cell values', function () {
        const dict = [
          makeDictRow({ column: 'Temp', attribute: 'sio:Temperature' }),
          makeDictRow({ column: 'Pressure', attribute: 'sio:Pressure' })
        ];
        const csvRows = [{ Temp: '25', Pressure: '' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        expect(result[0]['sio:hasAttribute']).to.have.length(1);
        expect(result[0]['sio:hasAttribute'][0]['@type']).to.equal(
          'sio:Temperature'
        );
      });

      it('should skip attributes when column not in CSV', function () {
        const dict = [
          makeDictRow({ column: 'Temp', attribute: 'sio:Temperature' }),
          makeDictRow({ column: 'Missing', attribute: 'sio:Other' })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        expect(result[0]['sio:hasAttribute']).to.have.length(1);
      });
    });

    context('entity + attribute mode', function () {
      it('should create entity nodes and nest attributes via attributeOf', function () {
        const dict = [
          makeDictRow({ column: '??Measurement', entity: 'sio:Measurement' }),
          makeDictRow({
            column: 'Temperature',
            attribute: 'sio:Temperature',
            attributeOf: '??Measurement'
          }),
          makeDictRow({
            column: 'Pressure',
            attribute: 'sio:Pressure',
            attributeOf: '??Measurement'
          })
        ];
        const csvRows = [{ Temperature: '25', Pressure: '101' }];

        const result = generateAttributes(csvRows, dict, npId, 0);
        const entity = result.find((n) => n['@type'] === 'sio:Measurement');
        expect(entity).to.exist;
        expect(entity['sio:hasAttribute']).to.have.length(2);
        expect(entity).to.not.have.property('sio:hasValue');
      });

      it('should set sio:isAttributeOf on child nodes', function () {
        const dict = [
          makeDictRow({ column: '??Parent', entity: 'sio:Entity' }),
          makeDictRow({
            column: 'Temp',
            attribute: 'sio:Temperature',
            attributeOf: '??Parent'
          })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const entity = result.find((n) => n['@type'] === 'sio:Entity');
        const child = entity['sio:hasAttribute'][0];
        expect(child['sio:isAttributeOf']).to.deep.equal([
          { '@id': generateAttributeId(`${npId}/sample-1`, '??Parent') }
        ]);
      });

      it('should promote orphaned attributes to root when parent entity is missing', function () {
        const dict = [
          makeDictRow({ column: '??Exists', entity: 'sio:Entity' }),
          makeDictRow({
            column: 'Temp',
            attribute: 'sio:Temperature',
            attributeOf: '??Missing'
          })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        expect(result).to.have.length(2);
        const orphan = result.find((n) => n['@type'] === 'sio:Temperature');
        expect(orphan).to.exist;
        expect(orphan['sio:hasValue']).to.deep.equal({
          '@value': 25,
          '@type': 'xsd:double'
        });
      });
    });

    context('multiple CSV rows', function () {
      it('should generate one sample node per row', function () {
        const dict = [
          makeDictRow({ column: 'Temp', attribute: 'sio:Temperature' })
        ];
        const csvRows = [{ Temp: '25' }, { Temp: '30' }, { Temp: '35' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        expect(result).to.have.length(3);
        expect(result[0]['@id']).to.include('sample-1');
        expect(result[1]['@id']).to.include('sample-2');
        expect(result[2]['@id']).to.include('sample-3');
      });

      it('should apply fileOffset to sample numbering', function () {
        const dict = [
          makeDictRow({ column: 'Temp', attribute: 'sio:Temperature' })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 10);
        expect(result[0]['@id']).to.include('sample-11');
      });
    });

    context('predicates', function () {
      it('should apply rdfs:label when label differs from column', function () {
        const dict = [
          makeDictRow({
            column: 'Temp',
            label: 'Temperature',
            attribute: 'sio:Temperature'
          })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['rdfs:label']).to.equal('Temperature');
      });

      it('should not set rdfs:label when label equals column', function () {
        const dict = [
          makeDictRow({
            column: 'Temperature',
            label: 'Temperature',
            attribute: 'sio:Temperature'
          })
        ];
        const csvRows = [{ Temperature: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr).to.not.have.property('rdfs:label');
      });

      it('should apply unit with resolved IRI', function () {
        const dict = [
          makeDictRow({
            column: 'Temp',
            attribute: 'sio:Temperature',
            unit: 'celsius'
          })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['sio:hasUnit']).to.deep.equal([
          {
            '@type':
              'http://www.ontology-of-units-of-measure.org/resource/om-2/DegreeCelsius',
            '@value': 'celsius'
          }
        ]);
      });

      it('should apply comment and definition', function () {
        const dict = [
          makeDictRow({
            column: 'Temp',
            attribute: 'sio:Temperature',
            comment: 'Measured in lab',
            definition: 'Ambient temperature'
          })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['rdfs:comment']).to.equal('Measured in lab');
        expect(attr['skos:definition']).to.equal('Ambient temperature');
      });

      it('should apply role', function () {
        const dict = [
          makeDictRow({
            column: 'Temp',
            attribute: 'sio:Temperature',
            role: 'sio:IndependentVariable'
          })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['sio:hasRole']).to.deep.equal({
          '@id': 'sio:IndependentVariable'
        });
      });

      it('should apply relation and inRelationTo', function () {
        const dict = [
          makeDictRow({
            column: 'Temp',
            attribute: 'sio:Temperature',
            relation: 'sio:measurementOf',
            inRelationTo: 'sio:Sample'
          })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['sio:measurementOf']).to.equal('sio:Sample');
      });

      it('should use sio:inRelationTo as default relation predicate', function () {
        const dict = [
          makeDictRow({
            column: 'Temp',
            attribute: 'sio:Temperature',
            inRelationTo: 'sio:Sample'
          })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['sio:inRelationTo']).to.equal('sio:Sample');
      });

      it('should apply prov:wasDerivedFrom and prov:wasGeneratedBy', function () {
        const dict = [
          makeDictRow({
            column: 'Temp',
            attribute: 'sio:Temperature',
            wasDerivedFrom: '??Source',
            wasGeneratedBy: '??Process'
          })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['prov:wasDerivedFrom']).to.be.an('array');
        expect(attr['prov:wasGeneratedBy']).to.be.an('array');
      });

      it('should apply format as sio:hasFormat (non-file formats)', function () {
        const dict = [
          makeDictRow({
            column: 'Temp',
            attribute: 'sio:Temperature',
            format: 'xsd:float'
          })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['sio:hasFormat']).to.equal('xsd:float');
      });

      it('should NOT apply sio:hasFormat for file-type format values', function () {
        const dict = [
          makeDictRow({
            column: 'Datafile',
            attribute: 'schema:ImageObject',
            format: 'file'
          })
        ];
        const csvRows = [{ Datafile: 'test.png' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr).to.not.have.property('sio:hasFormat');
      });

      it('should resolve time references', function () {
        const dict = [
          makeDictRow({
            column: 'Temp',
            attribute: 'sio:Temperature',
            time: '??Timepoint'
          })
        ];
        const csvRows = [{ Temp: '25' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['sio:hasTimepoint']).to.be.an('array');
      });
    });

    context('file references', function () {
      it('should set @type and schema:contentUrl for single file ref', function () {
        const dict = [
          makeDictRow({
            column: 'Datafile',
            attribute: 'schema:MediaObject',
            format: 'file'
          })
        ];
        const csvRows = [
          {
            Datafile: {
              __fileRef: true,
              files: [
                {
                  url: 'http://ex/file/abc',
                  name: 'example.png',
                  schemaType: 'schema:ImageObject'
                }
              ]
            }
          }
        ];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['@type']).to.equal('schema:ImageObject');
        expect(attr['schema:contentUrl']).to.equal('http://ex/file/abc');
        expect(attr).to.not.have.property('sio:hasValue');
      });

      it('should nest multiple file refs as child nodes', function () {
        const dict = [
          makeDictRow({
            column: 'Datafile',
            attribute: 'schema:MediaObject',
            format: 'file'
          })
        ];
        const csvRows = [
          {
            Datafile: {
              __fileRef: true,
              files: [
                {
                  url: 'http://ex/a',
                  name: 'a.png',
                  schemaType: 'schema:ImageObject'
                },
                {
                  url: 'http://ex/b',
                  name: 'b.csv',
                  schemaType: 'schema:Dataset'
                }
              ]
            }
          }
        ];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['sio:hasAttribute']).to.have.length(2);
        expect(attr['sio:hasAttribute'][0]['@type']).to.equal(
          'schema:ImageObject'
        );
        expect(attr['sio:hasAttribute'][1]['@type']).to.equal('schema:Dataset');
      });
    });

    context('template resolution', function () {
      it('should resolve {col} placeholders in template for @id', function () {
        const dict = [
          makeDictRow({
            column: 'SampleName',
            attribute: 'sio:Identifier',
            template: 'http://ex.org/sample/{SampleName}'
          })
        ];
        const csvRows = [{ SampleName: 'ABC-123' }];
        const result = generateAttributes(csvRows, dict, npId, 0);
        const attr = result[0]['sio:hasAttribute'][0];
        expect(attr['@id']).to.equal('http://ex.org/sample/ABC-123');
      });
    });
  });

  // generateBatches
  describe('generateBatches', function () {
    it('should split rows into batches of the given size', function () {
      const dict = [
        makeDictRow({ column: 'Temp', attribute: 'sio:Temperature' })
      ];
      const csvRows = [{ Temp: '1' }, { Temp: '2' }, { Temp: '3' }];
      const batches = generateBatches(csvRows, dict, 'http://ex/np', 2);
      expect(batches).to.have.length(2);
      expect(batches[0]).to.have.length(2);
      expect(batches[1]).to.have.length(1);
    });

    it('should offset sample IDs correctly across batches', function () {
      const dict = [
        makeDictRow({ column: 'Temp', attribute: 'sio:Temperature' })
      ];
      const csvRows = [{ Temp: '1' }, { Temp: '2' }, { Temp: '3' }];
      const batches = generateBatches(csvRows, dict, 'http://ex/np', 2);
      expect(batches[0][0]['@id']).to.include('sample-1');
      expect(batches[0][1]['@id']).to.include('sample-2');
      expect(batches[1][0]['@id']).to.include('sample-3');
    });

    it('should return a single batch when rows fit within batch size', function () {
      const dict = [
        makeDictRow({ column: 'Temp', attribute: 'sio:Temperature' })
      ];
      const csvRows = [{ Temp: '1' }];
      const batches = generateBatches(csvRows, dict, 'http://ex/np', 500);
      expect(batches).to.have.length(1);
    });
  });

  // Integration: parseDictSheet → generateAttributes
  describe('Integration: parseDictSheet → generateAttributes', function () {
    it('should produce correct JSON-LD structure from an XLSX + CSV', function () {
      const buf = buildSddXlsx(
        [
          // col, label, comment, definition, attribute, attributeOf, unit, format, time, entity, ...rest
          [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'sio:Measurement',
            null,
            null,
            null,
            null,
            null,
            null
          ].map((v, i) => (i === 0 ? '??Measurement' : v)),
          [
            'Grain Size',
            'GS',
            'grain diameter',
            'Average grain diameter',
            'sio:Width',
            '??Measurement',
            'nm'
          ],
          [
            'Temperature',
            'Temp',
            '',
            '',
            'sio:Temperature',
            '??Measurement',
            'celsius'
          ],
          ['Solvent', '', '', '', 'sio:Descriptor', '??Measurement']
        ],
        [
          [
            'nm',
            'http://www.ontology-of-units-of-measure.org/resource/om-2/Nanometre',
            'nanometre'
          ]
        ]
      );

      const { dictRows, codeMappings } = parseDictSheet(buf);
      expect(dictRows).to.have.length(4);

      const csvRows = [
        { 'Grain Size': '50', Temperature: '25', Solvent: 'Water' },
        { 'Grain Size': '75', Temperature: '30', Solvent: '' }
      ];

      const npId = 'http://materialsmine.org/np/test-integration';
      const result = generateAttributes(
        csvRows,
        dictRows,
        npId,
        0,
        codeMappings
      );

      // Row 1: entity with 3 attributes (GS, Temp, Solvent)
      const entity1 = result.find(
        (n) => n['@type'] === 'sio:Measurement' && n['@id'].includes('sample-1')
      );
      expect(entity1).to.exist;
      expect(entity1['sio:hasAttribute']).to.have.length(3);

      const gs = entity1['sio:hasAttribute'].find(
        (a) => a['@type'] === 'sio:Width'
      );
      expect(gs['sio:hasValue']).to.deep.equal({
        '@value': 50,
        '@type': 'xsd:double'
      });
      expect(gs['rdfs:label']).to.equal('GS');
      expect(gs['rdfs:comment']).to.equal('grain diameter');
      expect(gs['sio:hasUnit'][0]['@type']).to.include('Nanometre');

      const solvent = entity1['sio:hasAttribute'].find(
        (a) => a['@type'] === 'sio:Descriptor'
      );
      expect(solvent['sio:hasValue']).to.equal('Water');

      // Row 2: entity with 2 attributes (Solvent empty → skipped)
      const entity2 = result.find(
        (n) => n['@type'] === 'sio:Measurement' && n['@id'].includes('sample-2')
      );
      expect(entity2).to.exist;
      expect(entity2['sio:hasAttribute']).to.have.length(2);
      const types2 = entity2['sio:hasAttribute'].map((a) => a['@type']);
      expect(types2).to.include('sio:Width');
      expect(types2).to.include('sio:Temperature');
      expect(types2).to.not.include('sio:Descriptor');
    });
  });
});
