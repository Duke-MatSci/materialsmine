'use strict';

const { expect } = require('chai');
const jsonld = require('jsonld');
const {
  transformXmlToNanopub,
  buildBatchNanopub
} = require('../../src/utils/curation-builder');
const {
  generateAttributes,
  generateBatches
} = require('../../src/utils/sdd-serializer');
const { deprecated } = require('../../config/qudt-units.json');

const QUDT = 'http://qudt.org/vocab/unit/';
const HAS_UNIT = 'http://semanticscience.org/resource/SIO_000221';
const HAS_UNIT_TEXT = 'http://materialsmine.org/resource/hasUnitText';
const XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';
const OM2_DEGREE_CELSIUS =
  'http://www.ontology-of-units-of-measure.org/resource/om-2/degreeCelsius';

const quietLogger = { info() {}, warn() {}, error() {}, debug() {} };

const SAMPLE_ID = 'units-1';
const BASE = `http://materialsmine.org/resource/pnc/${SAMPLE_ID}`;

// One parsed XML sample with a unit at a site from each group of writers.
// The SurfaceArea specific entry carries a unit and nothing else.
function richXml(unit) {
  return {
    PolymerNanocomposite: {
      ID: SAMPLE_ID,
      MATERIALS: {
        Matrix: {
          MatrixComponent: {
            ChemicalName: 'epoxy',
            Density: { value: '1.2', unit },
            Additive: { Additive: 'stabilizer', Amount: { value: '2', unit } }
          }
        },
        Filler: {
          FillerComponent: {
            ChemicalName: 'silica',
            SurfaceArea: { specific: { unit }, total: { value: '20', unit } }
          }
        }
      },
      PROCESSING: {
        MeltMixing: {
          ChooseParameter: { Mixing: { Temperature: { value: '260', unit } } }
        }
      },
      PROPERTIES: {
        Thermal: { MeltingTemperature: { value: '160', unit } },
        Mechanical: {
          Tensile: {
            TensileModulus: { value: '3', unit },
            LoadingProfile: {
              AxisLabel: {
                xName: 'Strain',
                xUnit: unit,
                yName: 'Stress',
                yUnit: unit
              }
            }
          }
        }
      },
      MICROSTRUCTURE: {
        LengthUnit: unit,
        ImageFile: {
          File: 'http://x/y',
          Dimension: { width: '20', height: '20' }
        }
      }
    }
  };
}

// One parsed XML sample whose only unit is a mixing temperature's.
function oneUnitXml(unit) {
  return {
    PolymerNanocomposite: {
      ID: SAMPLE_ID,
      PROCESSING: {
        MeltMixing: {
          ChooseParameter: { Mixing: { Temperature: { value: '260', unit } } }
        }
      }
    }
  };
}

// One Dictionary Mapping row with a unit, and one CSV row for it.
function oneUnitDict(unit) {
  return [
    {
      column: 'Temp',
      label: '',
      comment: '',
      definition: '',
      attribute: 'sio:Temperature',
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
    }
  ];
}
const CSV_ROWS = [{ Temp: '25' }];
const NP_ID = 'http://materialsmine.org/np/units-1';

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach((n) => walk(n, visit));
  visit(node);
  Object.values(node).forEach((v) => walk(v, visit));
}

function findNode(root, pred) {
  let found;
  walk(root, (n) => {
    if (!found && pred(n)) found = n;
  });
  return found;
}

const byId = (id) => (root) => findNode(root, (n) => n['@id'] === id);
const axis = (a) => (root) => findNode(root, (n) => n['mm:axis'] === a);
const surfaceArea = (key) => (root) =>
  byId(`${BASE}/FillerComponent/SurfaceArea`)(root)[key];

// Unit-bearing nodes of richXml, one locator each.
const XML_SITES = [
  ['matrix Density', byId(`${BASE}/MatrixComponents/Density`)],
  ['matrix Additive Amount', byId(`${BASE}/MatrixComponents/Additive/Amount`)],
  [
    'mixing Temperature',
    byId(`${BASE}/processing/MeltMixing/Mixing/Temperature`)
  ],
  [
    'thermal MeltingTemperature',
    byId(`${BASE}/attr/properties/Thermal/MeltingTemperature`)
  ],
  [
    'mechanical TensileModulus',
    byId(`${BASE}/attr/properties/Mechanical/Tensile/TensileModulus`)
  ],
  ['x AxisLabel', axis('x')],
  ['y AxisLabel', axis('y')],
  ['microstructure width', byId(`${BASE}/imagefile/1/dimension/width`)],
  ['microstructure height', byId(`${BASE}/imagefile/1/dimension/height`)],
  ['SurfaceArea specific with only a unit', surfaceArea('mm:hasSpecific')],
  ['SurfaceArea total', surfaceArea('mm:hasTotal')]
];

async function xmlNanopub(xml) {
  const { nanopub } = await transformXmlToNanopub(xml, quietLogger);
  return nanopub;
}

function sddNanopub(unit) {
  const batches = generateBatches(
    CSV_ROWS,
    oneUnitDict(unit),
    NP_ID,
    500,
    new Map()
  );
  return buildBatchNanopub(batches[0], {
    baseId: 'http://materialsmine.org/resource/pnc/units-sdd',
    npId: NP_ID,
    assertionId: `${NP_ID}#assertion`
  });
}

// The unit triples of a document, as sorted N-Triples-like strings.
async function unitTriples(doc) {
  const quads = await jsonld.toRDF(doc);
  return quads
    .filter(
      (q) =>
        q.predicate.value === HAS_UNIT || q.predicate.value === HAS_UNIT_TEXT
    )
    .map((q) => {
      const o = q.object;
      const obj =
        o.termType === 'NamedNode'
          ? `<${o.value}>`
          : JSON.stringify(o.value) +
            (o.language ? `@${o.language}` : `^^<${o.datatype.value}>`);
      return `<${q.predicate.value}> ${obj}`;
    })
    .sort();
}

const link = (name) => `<${HAS_UNIT}> <${QUDT}${name}>`;
const text = (t) => `<${HAS_UNIT_TEXT}> ${JSON.stringify(t)}^^<${XSD_STRING}>`;

describe('QUDT unit writes', function () {
  describe('XML route', function () {
    XML_SITES.forEach(([site, locate]) => {
      it(`links a resolved unit and writes its text at the ${site}`, async function () {
        const node = locate(await xmlNanopub(richXml('nm')));
        expect(node, site).to.exist;
        expect(node['sio:SIO_000221']).to.deep.equal({ '@id': QUDT + 'NanoM' });
        expect(node['mm:hasUnitText']).to.equal('nm');
      });

      it(`keeps only the text of an unresolved unit at the ${site}`, async function () {
        const node = locate(await xmlNanopub(richXml('zorkmids')));
        expect(node, site).to.exist;
        expect(node).to.not.have.property('sio:SIO_000221');
        expect(node['mm:hasUnitText']).to.equal('zorkmids');
      });
    });

    it('writes every resolved unit as a link next to its text', async function () {
      const nodes = [];
      walk(await xmlNanopub(richXml('nm')), (n) => {
        if ('sio:SIO_000221' in n) nodes.push(n);
      });
      expect(
        nodes.map((n) => [typeof n['sio:SIO_000221'], n['mm:hasUnitText']])
      ).to.deep.equal(XML_SITES.map(() => ['object', 'nm']));
    });

    it('writes no link anywhere and every text for an unresolved unit', async function () {
      const linked = [];
      const texts = [];
      walk(await xmlNanopub(richXml('zorkmids')), (n) => {
        if ('sio:SIO_000221' in n) linked.push(n['sio:SIO_000221']);
        if ('mm:hasUnitText' in n) texts.push(n['mm:hasUnitText']);
      });
      expect(linked).to.deep.equal([]);
      expect(texts).to.deep.equal(XML_SITES.map(() => 'zorkmids'));
    });
  });

  describe('SDD route', function () {
    const attrFor = (unit) =>
      generateAttributes(CSV_ROWS, oneUnitDict(unit), NP_ID, 0)[0][
        'sio:SIO_000008'
      ][0];

    it('links a resolved unit as one @id object and writes its text', function () {
      const attr = attrFor('nm');
      expect(attr['sio:SIO_000221']).to.deep.equal({ '@id': QUDT + 'NanoM' });
      expect(attr['mm:hasUnitText']).to.equal('nm');
    });

    it('leaves out the link and writes the text of an unresolved unit', function () {
      const attr = attrFor('zorkmids');
      expect(attr).to.not.have.property('sio:SIO_000221');
      expect(attr['mm:hasUnitText']).to.equal('zorkmids');
    });

    it('writes neither key for whitespace-only unit text', function () {
      const attr = attrFor('   ');
      expect(attr).to.not.have.property('sio:SIO_000221');
      expect(attr).to.not.have.property('mm:hasUnitText');
    });
  });

  // The same unit text gives the same unit triples on both routes: the
  // link as an IRI object and the trimmed text as a plain literal.
  describe('same unit triples on both routes', function () {
    const CASES = [
      ['nm', [link('NanoM'), text('nm')]],
      ['Hz', [link('HZ'), text('Hz')]],
      ['zorkmids', [text('zorkmids')]],
      ['N/A', [text('N/A')]],
      ['unit:Gs', [link(deprecated.Gs), text('unit:Gs')]],
      ['celsius', [link('DEG_C'), text('celsius')]],
      [OM2_DEGREE_CELSIUS, [text(OM2_DEGREE_CELSIUS)]],
      [' GPa ', [link('GigaPA'), text('GPa')]]
    ];

    CASES.forEach(([unit, expected]) => {
      it(`writes ${JSON.stringify(unit)} as ${expected.length} unit triple(s)`, async function () {
        const xml = await unitTriples(await xmlNanopub(oneUnitXml(unit)));
        const sdd = await unitTriples(sddNanopub(unit));
        const want = [...expected].sort();
        expect({ xml, sdd }).to.deep.equal({ xml: want, sdd: want });
      });
    });
  });
});
