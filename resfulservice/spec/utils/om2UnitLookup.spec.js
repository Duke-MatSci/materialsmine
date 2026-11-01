'use strict';

const { expect } = require('chai');
const {
  resolveCodeMapping,
  generateAttributes
} = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');

const OM2 = 'http://www.ontology-of-units-of-measure.org/resource/om-2/';

// Code -> OM-2 2.0.59 unit local name it must link to, on both paths.
const EXACT_SYMBOLS = [
  ['GPa', 'gigapascal'],
  ['MPa', 'megapascal'],
  ['S/m', 'siemensPerMetre'],
  ['mm/min', 'millimetrePerMinute-Time'],
  ['V/m', 'voltPerMetre'],
  ['kg/mol', 'kilogramPerMole'],
  ['mol', 'mole'],
  ['\u03bcm', 'micrometre'],
  ['g/cm3', 'gramPerCubicCentimetre'],
  ['g cm-3', 'gramPerCubicCentimetre']
];

// Keys OM-2 gives to several units, or to calorie for 'c': the hand-kept
// tie-break default wins.
const TIE_BREAKS = [
  ['M', 'molar'],
  ['s', 'second-Time'],
  ['h', 'hour'],
  ['m', 'metre'],
  ['nm', 'nanometre'],
  ['c', 'coulomb']
];

// The exact tier is case-sensitive and beats the case-folded match.
const CASE_SENSITIVE = [
  ['pA', 'picoampere'],
  ['nM', 'nanomolar']
];

const TRIMMED = [[' GPa ', 'gigapascal']];

const GROUPS = [
  ['exact OM-2 symbols', EXACT_SYMBOLS],
  ['tie-break defaults', TIE_BREAKS],
  ['case-sensitive exact match', CASE_SENSITIVE],
  ['surrounding whitespace', TRIMMED]
];

describe('OM-2 exact unit lookup', function () {
  GROUPS.forEach(([title, cases]) => {
    describe(title, function () {
      cases.forEach(([code, localName]) => {
        it(`resolveCodeMapping links '${code}' to om-2/${localName}`, function () {
          expect(resolveCodeMapping(code, new Map())).to.equal(
            OM2 + localName
          );
        });

        it(`mapUnit links '${code}' to om-2/${localName}`, function () {
          expect(mapUnit(code)).to.equal(OM2 + localName);
        });
      });
    });
  });

  describe('Code Mappings sheet', function () {
    it('takes precedence over an exact OM-2 symbol', function () {
      const codeMappings = new Map([
        ['gpa', { uri: 'http://example.org/my-gpa', label: '' }]
      ]);
      expect(resolveCodeMapping('GPa', codeMappings)).to.equal(
        'http://example.org/my-gpa'
      );
    });
  });

  describe('codes with no OM-2 match', function () {
    it('resolveCodeMapping leaves mg/ml unlinked', function () {
      expect(resolveCodeMapping('mg/ml', new Map())).to.equal(undefined);
    });

    it('mapUnit leaves mg/ml unlinked', function () {
      expect(mapUnit('mg/ml')).to.equal(null);
    });

    it('mapUnit returns null for an unknown code', function () {
      expect(mapUnit('zorkmids')).to.equal(null);
    });
  });

  describe('generateAttributes', function () {
    it('links a mapped unit and keeps the typed text', function () {
      const dict = [
        {
          column: 'Modulus',
          label: '',
          comment: '',
          definition: '',
          attribute: 'sio:Modulus',
          attributeOf: '',
          unit: 'GPa',
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
      const csvRows = [{ Modulus: '3' }];
      const npId = 'http://materialsmine.org/np/test123';
      const result = generateAttributes(csvRows, dict, npId, 0);
      const attr = result[0]['sio:hasAttribute'][0];
      expect(attr['sio:hasUnit']).to.deep.equal([
        { '@type': OM2 + 'gigapascal', '@value': 'GPa' }
      ]);
    });
  });
});
