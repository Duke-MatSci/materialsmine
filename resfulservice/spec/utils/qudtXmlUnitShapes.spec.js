'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const { transformXmlToNanopub } = require('../../src/utils/curation-builder');

const QUDT = 'http://qudt.org/vocab/unit/';
const RECORD = 'shapes-1';
const BASE = `http://materialsmine.org/resource/pnc/${RECORD}`;
const OBJECT_TEXT = '[object Object]';

function stubLogger() {
  return {
    info: sinon.stub(),
    warn: sinon.stub(),
    error: sinon.stub(),
    debug: sinon.stub()
  };
}

// One parsed XML record with a unit at a plain site, a SCALAR_UNIT_PATHS
// site, both AxisLabel units, the MICROSTRUCTURE LengthUnit and a
// SurfaceArea specific entry. The y axis and the specific entry hold only
// their unit; unitAt() gives a fresh unit value for each site.
function shapeXml(unitAt) {
  return {
    PolymerNanocomposite: {
      ID: RECORD,
      MATERIALS: {
        Filler: {
          FillerComponent: {
            ChemicalName: 'silica',
            SurfaceArea: {
              specific: { unit: unitAt() },
              total: { value: '20' }
            }
          }
        }
      },
      PROCESSING: {
        MeltMixing: {
          ChooseParameter: {
            Mixing: { Temperature: { value: '260', unit: unitAt() } }
          }
        }
      },
      PROPERTIES: {
        Thermal: {
          GlassTransitionTemperature: { value: '100', unit: unitAt() }
        },
        Mechanical: {
          Tensile: {
            TensileModulus: { value: '3' },
            LoadingProfile: {
              AxisLabel: { xName: 'Strain', xUnit: unitAt(), yUnit: unitAt() }
            }
          }
        }
      },
      MICROSTRUCTURE: {
        LengthUnit: unitAt(),
        ImageFile: {
          File: 'http://x/y',
          Dimension: { width: '20', height: '20' }
        }
      }
    }
  };
}

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
const specific = (root) =>
  byId(`${BASE}/FillerComponent/SurfaceArea`)(root)['mm:hasSpecific'];

// Unit-bearing nodes of shapeXml: name, locator, and whether the node
// exists only because of its unit.
const SITES = [
  [
    'mixing Temperature',
    byId(`${BASE}/processing/MeltMixing/Mixing/Temperature`),
    false
  ],
  [
    'thermal GlassTransitionTemperature',
    byId(`${BASE}/attr/properties/Thermal/GlassTransitionTemperature`),
    false
  ],
  ['x AxisLabel', axis('x'), false],
  ['y AxisLabel with only a unit', axis('y'), true],
  ['microstructure width', byId(`${BASE}/imagefile/1/dimension/width`), false],
  [
    'microstructure height',
    byId(`${BASE}/imagefile/1/dimension/height`),
    false
  ],
  ['SurfaceArea specific with only a unit', specific, true]
];

// Input paths of shapeXml's unit fields, one per field.
const PATHS = [
  'MATERIALS.Filler.FillerComponent.SurfaceArea.specific.unit',
  'PROCESSING.MeltMixing.ChooseParameter.Mixing.Temperature.unit',
  'PROPERTIES.Thermal.GlassTransitionTemperature.unit',
  'PROPERTIES.Mechanical.Tensile.LoadingProfile.AxisLabel.xUnit',
  'PROPERTIES.Mechanical.Tensile.LoadingProfile.AxisLabel.yUnit',
  'MICROSTRUCTURE.LengthUnit'
].sort();

function byPath(list) {
  expect(list).to.be.an('array');
  return [...list].sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0
  );
}

// The unit keys at each site, 'absent' where the node is missing.
function siteUnits(nanopub) {
  const out = {};
  SITES.forEach(([site, locate]) => {
    const node = locate(nanopub);
    out[site] = node
      ? {
          link: node['sio:SIO_000221'],
          text: node['mm:hasUnitText']
        }
      : 'absent';
  });
  return out;
}

// Transforms shapeXml with a fresh unit from make at each site.
async function run(make) {
  const logger = stubLogger();
  const { nanopub, issues } = await transformXmlToNanopub(
    shapeXml(make),
    logger
  );
  const warnings = logger.warn.getCalls().map((c) => String(c.args[0]));
  return {
    nanopub,
    issues: byPath(issues),
    units: siteUnits(nanopub),
    warnings
  };
}

const plain = (text) => () => text;
const attributed = (text) => () => ({ _: text, $: { id: '1' } });
const attributeOnly = () => ({ $: { id: '1' } });

// Shapes that read as the plain element K.
const LIKE_PLAIN_K = [
  ['an attributed element', attributed('K')],
  ['a repeated element with one text', () => ['K', 'K']],
  ['a repeated element whose items are plain and attributed', () => [
    'K',
    { _: 'K', $: { id: '1' } }
  ]],
  ['a repeated element with a blank item', () => ['', 'K']]
];

// Shapes that read as a blank unit.
const BLANK = [
  ['an attribute-only element', attributeOnly],
  ['a repeated element of blank and attribute-only items', () => [
    '',
    { $: { id: '1' } }
  ]],
  ['a repeated element of blank items', () => ['', '  ']]
];

const REPEATED_DIFFERING = () => ['K', 'cm'];

describe('QUDT units from attributed or repeated XML unit elements', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('links the plain element K at every site with no issue', async function () {
    const { units, issues } = await run(plain('K'));
    SITES.forEach(([site]) => {
      expect(units[site], site).to.deep.equal({
        link: { '@id': QUDT + 'K' },
        text: 'K'
      });
    });
    expect(issues).to.deep.equal([]);
  });

  LIKE_PLAIN_K.forEach(([shape, make]) => {
    it(`writes ${shape} as the plain element at every site`, async function () {
      const want = await run(plain('K'));
      const got = await run(make);
      expect({ units: got.units, issues: got.issues }).to.deep.equal({
        units: want.units,
        issues: want.issues
      });
    });
  });

  it('writes and reports an attributed element whose text fails as the plain element', async function () {
    const want = await run(plain('zorkmid'));
    const got = await run(attributed('zorkmid'));
    expect(want.issues.map((i) => i.path)).to.deep.equal(PATHS);
    expect({ units: got.units, issues: got.issues }).to.deep.equal({
      units: want.units,
      issues: want.issues
    });
    got.issues.forEach((i) => expect(i.value, i.path).to.equal('zorkmid'));
  });

  BLANK.forEach(([shape, make]) => {
    it(`treats ${shape} as a blank unit`, async function () {
      const { units, issues } = await run(make);
      SITES.forEach(([site, , onlyUnit]) => {
        if (onlyUnit) {
          expect(units[site], site).to.equal('absent');
        } else {
          expect(units[site], site).to.deep.equal({
            link: undefined,
            text: undefined
          });
        }
      });
      expect(issues).to.deep.equal([]);
    });
  });

  it('writes no unit at any site for a repeated element with different texts', async function () {
    const { units } = await run(REPEATED_DIFFERING);
    SITES.forEach(([site]) => {
      expect(units[site], site).to.deep.equal({
        link: undefined,
        text: undefined
      });
    });
  });

  it('reports one UNIT_REPEATED warning per path for a repeated element with different texts', async function () {
    const { issues } = await run(REPEATED_DIFFERING);
    expect(
      issues.map(({ message, ...rest }) => rest)
    ).to.deep.equal(
      PATHS.map((path) => ({
        severity: 'warning',
        code: 'UNIT_REPEATED',
        value: ['K', 'cm'],
        record: RECORD,
        path
      }))
    );
    issues.forEach((i) => {
      expect(i.message, i.path).to.include('"K"').and.include('"cm"');
    });
  });

  it('gives a UNIT_REPEATED value of the non-blank item texts, untrimmed and in order', async function () {
    const { issues } = await run(() => [
      'K',
      '',
      { _: ' cm ', $: { id: '1' } }
    ]);
    expect(issues.map((i) => [i.code, i.value])).to.deep.equal(
      PATHS.map(() => ['UNIT_REPEATED', ['K', ' cm ']])
    );
  });

  it('logs one warning per UNIT_REPEATED issue naming its record, path and texts', async function () {
    const { warnings } = await run(REPEATED_DIFFERING);
    const repeated = warnings.filter((m) => m.includes('UNIT_REPEATED'));
    expect(repeated).to.have.lengthOf(PATHS.length);
    PATHS.forEach((path) => {
      const hits = repeated.filter(
        (m) =>
          m.includes(RECORD) &&
          m.includes(path) &&
          m.includes('K') &&
          m.includes('cm')
      );
      expect(hits, path).to.have.lengthOf(1);
    });
  });

  // Shapes that hold an object.
  [
    ['an attributed element that fails', attributed('zorkmid')],
    ['an attributed element', attributed('K')],
    LIKE_PLAIN_K[2],
    BLANK[0],
    BLANK[1]
  ].forEach(([shape, make]) => {
    it(`writes and logs no object text for ${shape}`, async function () {
      const { nanopub, warnings } = await run(make);
      expect(JSON.stringify(nanopub)).to.not.include(OBJECT_TEXT);
      warnings.forEach((m) => expect(m).to.not.include(OBJECT_TEXT));
    });
  });
});
