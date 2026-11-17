'use strict';

const { expect } = require('chai');
const {
  resolveCodeMapping,
  generateAttributes
} = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');

// Required on call, so a load failure fails only the rows that use it.
const lookupUnit = (text) =>
  require('../../src/utils/unit-lookup').lookupUnit(text);

const QUDT = 'http://qudt.org/vocab/unit/';

// Text that is a key of exactly one QUDT unit links to it, on both routes.
const EXACT_KEYS = [
  ['\u00b0C', 'DEG_C'],
  ['MPa', 'MegaPA'],
  ['GPa', 'GigaPA'],
  ['%', 'PERCENT'],
  ['g/cm\u00b3', 'GM-PER-CentiM3'],
  ['mm', 'MilliM'],
  ['s', 'SEC'],
  ['kN', 'KiloN'],
  ['MJ/m\u00b3', 'MegaJ-PER-M3'],
  ['S/m', 'S-PER-M'],
  ['mm/min', 'MilliM-PER-MIN'],
  ['V/m', 'V-PER-M'],
  ['kg/mol', 'KiloGM-PER-MOL'],
  ['mol', 'MOL'],
  ['\u03bcm', 'MicroM'],
  ['h', 'HR'],
  ['m', 'M'],
  ['nm', 'NanoM'],
  ['mL', 'MilliL'],
  ['Hz', 'HZ'],
  ['J/(g\u00b7K)', 'J-PER-GM-K'],
  ['rpm', 'REV-PER-MIN'],
  ['r/min', 'REV-PER-MIN'],
  ['Micrometre', 'MicroM'],
  ['Kelvin', 'K']
];

// The exact tier is case-sensitive and beats any case-folded match.
const CASE_SENSITIVE = [
  ['pA', 'PicoA'],
  ['nA', 'NanoA'],
  ['mM', 'MilliMOL-PER-L']
];

const TRIMMED = [[' GPa ', 'GigaPA']];

// UCUM and UDUNITS codes link only when typed exactly.
const CODES = [
  ['um', 'MicroM'],
  ['cm-1', 'PER-CentiM'],
  ['Cel', 'DEG_C']
];

// An exact key wins over units whose keys only fold to the text.
const EXACT_WINS = [
  ['C', 'C'],
  ['ML', 'MegaL'],
  ['RAD', 'RAD_R'],
  ['s/m', 'SEC-PER-M']
];

// Keys several units share link to the hand-kept tie-break unit.
const TIE_BREAKS = [
  ['K', 'K'],
  ['S', 'S'],
  ['L', 'L'],
  ['rad', 'RAD'],
  ['d', 'DAY'],
  ['t', 'TONNE'],
  ['F', 'FARAD'],
  ['pH', 'PH'],
  ['mrad', 'MilliRAD'],
  ['s-1', 'PER-SEC']
];

const GROUPS = [
  ['exact QUDT keys and symbols', EXACT_KEYS],
  ['case-sensitive exact match', CASE_SENSITIVE],
  ['surrounding whitespace', TRIMMED],
  ['exact codes', CODES],
  ['exact match over folded match', EXACT_WINS],
  ['tie-break defaults', TIE_BREAKS]
];

const NOT_UNITS = ['-', 'N/A', 'NA', 'n/a', 'none'];

describe('QUDT exact unit lookup', function () {
  GROUPS.forEach(([title, cases]) => {
    describe(title, function () {
      cases.forEach(([text, localName]) => {
        it(`resolveCodeMapping links '${text}' to unit:${localName}`, function () {
          expect(resolveCodeMapping(text, new Map())).to.equal(
            QUDT + localName
          );
        });

        it(`mapUnit links '${text}' to unit:${localName}`, function () {
          expect(mapUnit(text)).to.equal(QUDT + localName);
        });
      });
    });
  });

  describe('lookupUnit', function () {
    it('returns the full QUDT IRI of a linked unit', function () {
      expect(lookupUnit('GPa')).to.deep.equal({ iri: QUDT + 'GigaPA' });
    });
  });

  describe('codes are not case-folded', function () {
    it("lookupUnit reports 'cel' as unresolved", function () {
      const { issue } = lookupUnit('cel');
      expect(issue.code).to.equal('UNIT_UNRESOLVED');
      expect(issue.value).to.equal('cel');
      expect(issue.message).to.be.a('string').that.is.not.empty;
    });

    it("resolveCodeMapping leaves 'cel' unlinked", function () {
      expect(resolveCodeMapping('cel', new Map())).to.equal(undefined);
    });

    it("mapUnit leaves 'cel' unlinked", function () {
      expect(mapUnit('cel')).to.equal(null);
    });
  });

  describe('values that are not units', function () {
    NOT_UNITS.forEach((text) => {
      it(`lookupUnit gives no link and no issue for '${text}'`, function () {
        expect(lookupUnit(text)).to.deep.equal({});
      });

      it(`resolveCodeMapping leaves '${text}' unlinked`, function () {
        expect(resolveCodeMapping(text, new Map())).to.equal(undefined);
      });

      it(`mapUnit leaves '${text}' unlinked`, function () {
        expect(mapUnit(text)).to.equal(null);
      });
    });
  });

  describe('missing text', function () {
    [null, '', '   '].forEach((text) => {
      it(`lookupUnit gives no link and no issue for ${JSON.stringify(text)}`, function () {
        expect(lookupUnit(text)).to.deep.equal({});
      });
    });
  });

  describe('Code Mappings sheet', function () {
    it('takes precedence over a QUDT match', function () {
      const codeMappings = new Map([
        ['gpa', { uri: 'http://example.org/my-gpa', label: '' }]
      ]);
      expect(resolveCodeMapping('GPa', codeMappings)).to.equal(
        'http://example.org/my-gpa'
      );
    });
  });

  describe('generateAttributes', function () {
    it('links a matched unit and keeps the typed text', function () {
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
        { '@type': QUDT + 'GigaPA', '@value': 'GPa' }
      ]);
    });
  });
});
