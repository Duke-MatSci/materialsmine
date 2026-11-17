'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const XLSX = require('xlsx');
const { Readable } = require('stream');
const minioClient = require('../../src/utils/minio');
const {
  transformXmlToNanopub,
  transformSddToNanopub
} = require('../../src/utils/curation-builder');
const { lookupUnit } = require('../../src/utils/unit-lookup');
const { resolveUnit } = require('../../src/utils/sdd-serializer');

const UNIT_CODE = /UNIT_(UNRESOLVED|AMBIGUOUS|NOT_QUDT|DEPRECATED)/;

function stubLogger() {
  return {
    info: sinon.stub(),
    warn: sinon.stub(),
    error: sinon.stub(),
    debug: sinon.stub()
  };
}

// First arguments of the logger's warn calls that name a unit issue code.
function unitWarnings(logger) {
  return logger.warn
    .getCalls()
    .map((c) => c.args[0])
    .filter((m) => typeof m === 'string' && UNIT_CODE.test(m));
}

// Each expected issue is logged by exactly one unit warning that holds its
// code, its value and every location string, and there are no others.
function expectOneWarningPerIssue(logger, expected, locate) {
  const messages = unitWarnings(logger);
  expect(messages).to.have.lengthOf(expected.length);
  expected.forEach((issue) => {
    const parts = [issue.code, issue.value, ...locate(issue)];
    const hits = messages.filter((m) => parts.every((p) => m.includes(p)));
    expect(hits, JSON.stringify(parts)).to.have.lengthOf(1);
  });
}

// The issue the route gives for a unit, from the lookup's own issue.
function issueFrom(lookup, code, location) {
  expect(lookup.issue, JSON.stringify(location)).to.exist;
  expect(lookup.issue.code, JSON.stringify(location)).to.equal(code);
  return {
    severity: 'warning',
    code,
    message: lookup.issue.message,
    value: lookup.issue.value,
    ...location
  };
}

/* ------------------------------ XML route ------------------------------ */

const RECORD = 'issues-1';

const xmlIssue = (unit, code, path) =>
  issueFrom(lookupUnit(unit), code, { record: RECORD, path });

function byPath(list) {
  expect(list).to.be.an('array');
  return [...list].sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0
  );
}

const mixing = (unit) => ({ Mixing: { RPM: { value: '100', unit } } });

// One parsed XML record whose units fail the lookup at sites of each kind.
function failingXml() {
  return {
    PolymerNanocomposite: {
      ID: RECORD,
      MATERIALS: {
        Matrix: {
          MatrixComponent: {
            ChemicalName: 'epoxy',
            Density: { value: '1.2', unit: 'zorkmid' },
            Viscosity: {
              FixedValue: { value: { value: '5', unit: 'zorkmid' } }
            }
          }
        },
        Filler: {
          FillerComponent: {
            ChemicalName: 'silica',
            SurfaceArea: {
              specific: { unit: 'nm' },
              total: { value: '20', unit: 'unit:Gs' }
            }
          }
        }
      },
      PROPERTIES: {
        Thermal: {
          MeltingTemperature: { value: '160', Unit: ' http://ex/x ' }
        },
        Mechanical: {
          Tensile: {
            TensileModulus: { value: '3', unit: 'N/A' },
            LoadingProfile: {
              AxisLabel: {
                xName: 'Strain',
                xUnit: 'pa',
                yName: 'Stress',
                yUnit: ''
              }
            }
          }
        }
      }
    }
  };
}

const FAILING_XML_ISSUES = () => [
  xmlIssue(
    'zorkmid',
    'UNIT_UNRESOLVED',
    'MATERIALS.Matrix.MatrixComponent.Density.unit'
  ),
  xmlIssue(
    'zorkmid',
    'UNIT_UNRESOLVED',
    'MATERIALS.Matrix.MatrixComponent.Viscosity.FixedValue.value.unit'
  ),
  xmlIssue(
    'unit:Gs',
    'UNIT_DEPRECATED',
    'MATERIALS.Filler.FillerComponent.SurfaceArea.total.unit'
  ),
  xmlIssue(
    ' http://ex/x ',
    'UNIT_NOT_QUDT',
    'PROPERTIES.Thermal.MeltingTemperature.Unit'
  ),
  xmlIssue(
    'pa',
    'UNIT_AMBIGUOUS',
    'PROPERTIES.Mechanical.Tensile.LoadingProfile.AxisLabel.xUnit'
  )
];

// Mixing entries at positions 1, 2 and 4 of a ChooseParameter array, with
// an Additive at 3 whose amount has a unit and no value.
function chooseParameterXml() {
  return {
    PolymerNanocomposite: {
      ID: RECORD,
      PROCESSING: {
        MeltMixing: {
          ChooseParameter: [
            mixing('nm'),
            mixing('zorkmid'),
            { Additive: { Additive: 'x', Amount: { unit: 'zorkmid' } } },
            mixing('pa')
          ]
        }
      }
    }
  };
}

// One LengthUnit shared by two images, each with a width and a height.
function microstructureXml(unit) {
  return {
    PolymerNanocomposite: {
      ID: RECORD,
      MICROSTRUCTURE: {
        LengthUnit: unit,
        ImageFile: [
          { File: 'http://x/a', Dimension: { width: '20', height: '20' } },
          { File: 'http://x/b', Dimension: { width: '5', height: '6' } }
        ]
      }
    }
  };
}

// One record whose units resolve, are blank or are not units.
function cleanXml() {
  return {
    PolymerNanocomposite: {
      ID: RECORD,
      MATERIALS: {
        Matrix: {
          MatrixComponent: {
            ChemicalName: 'epoxy',
            Density: { value: '1.2', unit: 'nm' }
          }
        }
      },
      PROCESSING: {
        MeltMixing: { ChooseParameter: [mixing('celsius'), mixing('')] }
      },
      PROPERTIES: {
        Thermal: { MeltingTemperature: { value: '160', unit: 'N/A' } }
      },
      MICROSTRUCTURE: {
        LengthUnit: '   ',
        ImageFile: {
          File: 'http://x/a',
          Dimension: { width: '20', height: '20' }
        }
      }
    }
  };
}

describe('QUDT unit issues', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('XML route', function () {
    it('returns one warning per failing unit, located by record and input path', async function () {
      const { issues } = await transformXmlToNanopub(
        failingXml(),
        stubLogger()
      );
      expect(byPath(issues)).to.deep.equal(byPath(FAILING_XML_ISSUES()));
    });

    it('indexes a repeated element by its 1-based position in the path', async function () {
      const { issues } = await transformXmlToNanopub(
        chooseParameterXml(),
        stubLogger()
      );
      expect(byPath(issues)).to.deep.equal(
        byPath([
          xmlIssue(
            'zorkmid',
            'UNIT_UNRESOLVED',
            'PROCESSING.MeltMixing.ChooseParameter[2].Mixing.RPM.unit'
          ),
          xmlIssue(
            'pa',
            'UNIT_AMBIGUOUS',
            'PROCESSING.MeltMixing.ChooseParameter[4].Mixing.RPM.unit'
          )
        ])
      );
    });

    it('gives one issue for a LengthUnit written on every image', async function () {
      const { issues } = await transformXmlToNanopub(
        microstructureXml('zorkmid'),
        stubLogger()
      );
      expect(issues).to.deep.equal([
        xmlIssue('zorkmid', 'UNIT_UNRESOLVED', 'MICROSTRUCTURE.LengthUnit')
      ]);
    });

    it('returns no issues and logs no unit warning for clean, blank and non-unit text', async function () {
      const logger = stubLogger();
      const result = await transformXmlToNanopub(cleanXml(), logger);
      expect(result.issues).to.deep.equal([]);
      expect(unitWarnings(logger)).to.deep.equal([]);
    });

    it('logs one warning per issue naming its code, value, record and path', async function () {
      const logger = stubLogger();
      await transformXmlToNanopub(failingXml(), logger);
      expectOneWarningPerIssue(logger, FAILING_XML_ISSUES(), (i) => [
        i.record,
        i.path
      ]);
    });
  });

  /* ------------------------------ SDD route ------------------------------ */

  describe('SDD route', function () {
    const SDD_NAME = 'issues-sdd.xlsx';
    const CSV_NAME = 'issues-data.csv';
    const MAPPED_URI = 'http://ex/um2';
    const CODE_MAPPINGS = new Map([['nm', { uri: MAPPED_URI, label: '' }]]);

    function dictRow(column, unit) {
      const row = {
        column,
        label: '',
        comment: '',
        definition: '',
        attribute: 'sio:Quantity',
        attributeOf: '',
        unit,
        format: '',
        time: '',
        entity: '',
        role: '',
        relation: '',
        inRelationTo: '',
        wasDerivedFrom: '',
        wasGeneratedBy: '',
        template: ''
      };
      return Object.values(row);
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
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([dictHeader, ...dictRows]),
        'Dictionary Mapping'
      );
      if (codeMappingRows) {
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.aoa_to_sheet([
            ['Code', 'URI', 'Label'],
            ...codeMappingRows
          ]),
          'Code Mappings'
        );
      }
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    function distribution(objectNames) {
      return {
        'mm:hasDistribution': {
          'dcat:distribution': objectNames.map((name) => ({
            '@id': `http://localhost/api/files/${name}?isStore=true`,
            'rdfs:label': name
          }))
        }
      };
    }

    // Serve each object name from an in-memory store, a fresh stream per call.
    function stubStore(contents) {
      return sinon
        .stub(minioClient, 'getObject')
        .callsFake((bucket, name) => {
          if (!(name in contents)) throw new Error(`unexpected object ${name}`);
          return Readable.from([contents[name]]);
        });
    }

    function skeleton() {
      return {
        id: 'http://materialsmine.org/np/issues-sdd',
        distribution: distribution([SDD_NAME, CSV_NAME])
      };
    }

    const sddIssue = (unit, code, column) =>
      issueFrom(resolveUnit(unit, CODE_MAPPINGS), code, { column });

    // Dictionary rows with failing, mapped, clean, blank and non-unit units.
    // Absent has no CSV column; ??Calc is inferred on every row.
    function serveFailingSdd() {
      stubStore({
        [SDD_NAME]: buildSddXlsx(
          [
            dictRow('Temp', 'zorkmid'),
            dictRow('Pres', 'pa'),
            dictRow('Clean', 'celsius'),
            dictRow('Len', 'nm'),
            dictRow('Blank', ''),
            dictRow('Mag', 'unit:Gs'),
            dictRow('NA', 'N/A'),
            dictRow('??Calc', 'zorkmid'),
            dictRow('Absent', 'zorkmid')
          ],
          [['nm', MAPPED_URI, 'mapped nm']]
        ),
        [CSV_NAME]:
          'Temp,Pres,Clean,Len,Blank,Mag,NA\n' +
          '1,2,3,4,5,6,7\n' +
          '8,9,10,11,12,13,14\n' +
          '15,16,17,18,19,20,21\n'
      });
    }

    const FAILING_SDD_ISSUES = () => [
      sddIssue('zorkmid', 'UNIT_UNRESOLVED', 'Temp'),
      sddIssue('pa', 'UNIT_AMBIGUOUS', 'Pres'),
      // A mapped unit's value is its Code Mappings address.
      { ...sddIssue('nm', 'UNIT_NOT_QUDT', 'Len'), value: MAPPED_URI },
      sddIssue('unit:Gs', 'UNIT_DEPRECATED', 'Mag'),
      sddIssue('zorkmid', 'UNIT_UNRESOLVED', '??Calc'),
      sddIssue('zorkmid', 'UNIT_UNRESOLVED', 'Absent')
    ];

    it('returns one warning per failing dictionary row, in dictionary order, located by its column', async function () {
      serveFailingSdd();
      const { issues } = await transformSddToNanopub(
        skeleton(),
        stubLogger()
      );
      expect(issues).to.deep.equal(FAILING_SDD_ISSUES());
    });

    it('returns no issues and logs no unit warning for clean, blank and non-unit text', async function () {
      stubStore({
        [SDD_NAME]: buildSddXlsx([
          dictRow('Temp', 'celsius'),
          dictRow('Blank', ''),
          dictRow('NA', 'N/A')
        ]),
        [CSV_NAME]: 'Temp,Blank,NA\n1,2,3\n'
      });
      const logger = stubLogger();
      const result = await transformSddToNanopub(skeleton(), logger);
      expect(result.issues).to.deep.equal([]);
      expect(unitWarnings(logger)).to.deep.equal([]);
    });

    it('logs one warning per issue naming its code, value and column', async function () {
      serveFailingSdd();
      const logger = stubLogger();
      await transformSddToNanopub(skeleton(), logger);
      expectOneWarningPerIssue(logger, FAILING_SDD_ISSUES(), (i) => [
        i.column
      ]);
    });
  });
});
