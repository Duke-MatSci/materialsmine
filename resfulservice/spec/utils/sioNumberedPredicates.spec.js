'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const jsonld = require('jsonld');
const XLSX = require('xlsx');
const { Readable } = require('stream');
const minioClient = require('../../src/utils/minio');
const {
  transformXmlToNanopub,
  transformSddToNanopub,
  buildBatchNanopub
} = require('../../src/utils/curation-builder');
const { generateAttributes } = require('../../src/utils/sdd-serializer');

const SIO = 'http://semanticscience.org/resource/';
const NAMED = ['hasAttribute', 'hasValue', 'hasUnit', 'isAttributeOf'].map(
  (n) => SIO + n
);
const HAS_ATTRIBUTE = SIO + 'SIO_000008';
const HAS_VALUE = SIO + 'SIO_000300';
const HAS_UNIT = SIO + 'SIO_000221';
const IS_ATTRIBUTE_OF = SIO + 'SIO_000011';

const quietLogger = { info() {}, warn() {}, error() {}, debug() {} };

const compact = (iri) => iri.replace(SIO, 'sio:');

function objectKeys(node, keys = new Set()) {
  if (Array.isArray(node)) node.forEach((n) => objectKeys(n, keys));
  else if (node && typeof node === 'object') {
    Object.entries(node).forEach(([k, v]) => {
      keys.add(k);
      objectKeys(v, keys);
    });
  }
  return keys;
}

// The named-form predicates of the four links that a document's quads use
// and which of the given numbered predicates they use, and the same for
// the compact keys of the built document.
async function sioLinks(doc, numbered) {
  const quads = await jsonld.toRDF(doc);
  const used = new Set(quads.map((q) => q.predicate.value));
  const keys = objectKeys(doc);
  return {
    named: NAMED.filter((p) => used.has(p)),
    numbered: numbered.filter((p) => used.has(p)),
    namedKeys: NAMED.map(compact).filter((k) => keys.has(k)),
    numberedKeys: numbered.map(compact).filter((k) => keys.has(k))
  };
}

const expected = (numbered) => ({
  named: [],
  numbered,
  namedKeys: [],
  numberedKeys: numbered.map(compact)
});

/* ------------------------------ XML route ------------------------------ */

const U = 'nm';
const vu = () => ({ value: '1', unit: U });
const table = () => ({
  headers: { column: ['Strain', 'Stress'] },
  rows: { row: [{ column: ['0.1', '2'] }, { column: ['0.2', '4'] }] }
});
const withTable = () => ({
  ...vu(),
  data: { data: table(), description: 'd' }
});
const mixingAll = () => ({
  Mixing: { RPM: vu(), Time: vu(), Temperature: vu() }
});
const extrusionAll = () => ({
  Extrusion: {
    TwinScrewExtrusion: {
      ScrewDiameter: vu(),
      FlightClearance: vu(),
      HeatingZone: [
        { barrelTemperature: vu(), lengthOfHeatingZone: vu() },
        { barrelTemperature: vu() }
      ],
      Output: [{ MeltTemperature: vu() }, { MeltTemperature: vu() }]
    }
  }
});
const paramsAll = () => [
  { Curing: { Temperature: vu() } },
  { Additive: { Additive: 'a', Amount: vu() } },
  { Solvent: { SolventName: 's', SolventAmount: vu() } },
  mixingAll(),
  extrusionAll()
];

// One parsed record that reaches every XML builder writing the four links:
// matrix, filler, filler composition, additive, matrix, filler and section
// processing, thermal and mechanical properties, tables, images and units.
function everySiteXml() {
  return {
    PolymerNanocomposite: {
      ID: 'sio-1',
      MATERIALS: {
        Matrix: {
          MatrixComponent: {
            ChemicalName: 'e',
            PolymerType: 'thermoset',
            MatrixComponentComposition: { Constituent: ['c1', 'c2'] },
            MolecularWeight: [
              { value: '5', unit: U },
              { value: { value: '6', unit: U } }
            ],
            Density: vu(),
            Viscosity: { value: vu() },
            Additive: { Additive: 'q', Amount: vu() }
          },
          MatrixProcessing: { ChooseParameter: paramsAll() }
        },
        Filler: {
          FillerComponent: [
            {
              ChemicalName: 's',
              Density: vu(),
              SphericalParticleDiameter: [vu(), vu()],
              SurfaceArea: { specific: vu(), total: vu() },
              ParticleAspectRatio: vu(),
              NonSphericalShape: { Width: vu() },
              ParticleSurfaceTreatment: {
                ChemicalName: 'c',
                Density: vu(),
                GraftDensity: vu(),
                MolecularWeight: vu()
              }
            },
            { ChemicalName: 't', Density: vu() }
          ],
          FillerComposition: {
            Constituent: 'silica',
            Fraction: { Mass: '0.1', Volume: '0.05' }
          },
          FillerProcessing: { ChooseParameter: [mixingAll()] }
        }
      },
      PROCESSING: {
        MeltMixing: { ChooseParameter: paramsAll() },
        SolutionProcessing: { ChooseParameter: [mixingAll()] }
      },
      PROPERTIES: {
        Thermal: {
          GlassTransitionTemperature: { value: '1', Unit: U },
          MeasurementMethod: 'DSC',
          MeltingTemperature: withTable(),
          Crystallinity: { DegreeOfCrystallization: withTable() }
        },
        Mechanical: {
          Tensile: {
            TensileModulus: [withTable(), vu()],
            Conditions: { StrainRate: vu() },
            LoadingProfile: {
              AxisLabel: { xName: 'a', yName: 'b', yUnit: U },
              data: { data: table(), description: 'd' }
            }
          }
        }
      },
      MICROSTRUCTURE: {
        LengthUnit: U,
        ImageFile: [
          {
            File: 'http://x/a',
            MicroscopyType: 'SEM',
            Type: 'image',
            Dimension: { width: '1', height: '2' }
          },
          { File: 'http://x/b', Dimension: { width: '1' } }
        ]
      }
    }
  };
}

/* ------------------------------ SDD route ------------------------------ */

const SDD_NAME = 'sio-sdd.xlsx';
const CSV_NAME = 'sio-data.csv';
const NP_ID = 'http://materialsmine.org/np/sio-sdd';

const DICT_HEADER = [
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

function dictRow(overrides) {
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

// An inferred parent entity and a length attribute of it with a unit.
const ENTITY_DICT = [
  dictRow({ column: '??Parent', entity: 'sio:Entity' }),
  dictRow({
    column: 'Len',
    attribute: 'sio:Length',
    attributeOf: '??Parent',
    unit: 'nm'
  })
];

function sddXlsx(dict) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([DICT_HEADER, ...dict.map(Object.values)]),
    'Dictionary Mapping'
  );
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Serve each object name from an in-memory store, a fresh stream per call.
function stubStore(contents) {
  sinon.stub(minioClient, 'getObject').callsFake((bucket, name) => {
    if (!(name in contents)) throw new Error(`unexpected object ${name}`);
    return Readable.from([contents[name]]);
  });
}

function skeleton() {
  return {
    id: NP_ID,
    distribution: {
      'mm:hasDistribution': {
        'dcat:distribution': [SDD_NAME, CSV_NAME].map((name) => ({
          '@id': `http://localhost/api/files/${name}?isStore=true`,
          'rdfs:label': name
        }))
      }
    }
  };
}

// Samples of a later batch: entity samples whose attribute has a unit and
// whose file column holds two files, and attribute-only samples.
function laterBatchSamples() {
  const entityDict = [
    ...ENTITY_DICT,
    dictRow({
      column: 'Datafile',
      attribute: 'schema:MediaObject',
      attributeOf: '??Parent',
      format: 'file'
    })
  ];
  const files = {
    __fileRef: true,
    files: [
      { url: 'http://ex/a', name: 'a.png', schemaType: 'schema:ImageObject' },
      { url: 'http://ex/b', name: 'b.csv', schemaType: 'schema:Dataset' }
    ]
  };
  const attributeOnlyDict = [
    dictRow({ column: 'Temp', attribute: 'sio:Temperature', unit: 'nm' })
  ];
  const entityRows = [{ Len: '4', Datafile: files }];
  return [
    ...generateAttributes(entityRows, entityDict, NP_ID, 2),
    ...generateAttributes([{ Temp: '25' }], attributeOnlyDict, NP_ID, 3)
  ];
}

describe('numbered SIO link predicates', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('writes the numbered has-attribute, has-value and has-unit links and no named form for an XML record reaching every builder', async function () {
    const { nanopub } = await transformXmlToNanopub(
      everySiteXml(),
      quietLogger
    );
    expect(
      await sioLinks(nanopub, [HAS_ATTRIBUTE, HAS_VALUE, HAS_UNIT])
    ).to.deep.equal(expected([HAS_ATTRIBUTE, HAS_VALUE, HAS_UNIT]));
  });

  it('writes all four numbered links and no named form in the first SDD batch with samples', async function () {
    stubStore({
      [SDD_NAME]: sddXlsx(ENTITY_DICT),
      [CSV_NAME]: 'Len\n4\n5\n'
    });
    const { nanopub } = await transformSddToNanopub(skeleton(), quietLogger);
    const all = [HAS_ATTRIBUTE, HAS_VALUE, HAS_UNIT, IS_ATTRIBUTE_OF];
    expect(await sioLinks(nanopub, all)).to.deep.equal(expected(all));
  });

  it('writes all four numbered links and no named form in a later SDD batch', async function () {
    const doc = buildBatchNanopub(laterBatchSamples(), {
      baseId: 'http://materialsmine.org/resource/pnc/sio-sdd',
      npId: NP_ID,
      assertionId: `${NP_ID}#assertion`
    });
    const all = [HAS_ATTRIBUTE, HAS_VALUE, HAS_UNIT, IS_ATTRIBUTE_OF];
    expect(await sioLinks(doc, all)).to.deep.equal(expected(all));
  });
});
