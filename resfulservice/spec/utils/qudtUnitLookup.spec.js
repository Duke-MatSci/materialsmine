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

// Text that is a QUDT symbol, code or English label of exactly one unit
// links to it, on both routes.
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

// Matching is case-sensitive: text links only to the unit that writes it
// in that case.
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

// Text links to its own unit, not to units whose strings differ from it
// only in case.
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
  ['exact match over case-twins', EXACT_WINS],
  ['tie-break defaults', TIE_BREAKS]
];

// Placeholder text that QUDT does not write is unresolved like any other.
const PLACEHOLDERS = ['-', 'NA', 'n/a', 'none'];

// N/A is the QUDT symbol of newton per ampere.
const NEWTON_PER_AMPERE = 'N/A';

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

  describe('placeholder text', function () {
    PLACEHOLDERS.forEach((text) => {
      it(`lookupUnit reports '${text}' as unresolved`, function () {
        const { iri, issue } = lookupUnit(text);
        expect(issue, 'issue').to.exist;
        expect(iri).to.equal(undefined);
        expect(issue.code).to.equal('UNIT_UNRESOLVED');
        expect(issue.value).to.equal(text);
      });

      it(`resolveCodeMapping leaves '${text}' unlinked`, function () {
        expect(resolveCodeMapping(text, new Map())).to.equal(undefined);
      });

      it(`mapUnit leaves '${text}' unlinked`, function () {
        expect(mapUnit(text)).to.equal(null);
      });
    });
  });

  describe('the QUDT symbol N/A', function () {
    const iri = QUDT + 'N-PER-A';

    it('lookupUnit links it to unit:N-PER-A with no issue', function () {
      expect(lookupUnit(NEWTON_PER_AMPERE)).to.deep.equal({ iri });
    });

    it('resolveCodeMapping links it to unit:N-PER-A', function () {
      expect(resolveCodeMapping(NEWTON_PER_AMPERE, new Map())).to.equal(iri);
    });

    it('mapUnit links it to unit:N-PER-A', function () {
      expect(mapUnit(NEWTON_PER_AMPERE)).to.equal(iri);
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
    const resolveUnit = (code, codeMappings) =>
      require('../../src/utils/sdd-serializer').resolveUnit(
        code,
        codeMappings
      );

    it('takes precedence over a QUDT match', function () {
      const codeMappings = new Map([
        ['gpa', { uri: 'unit:MegaPA', label: '' }]
      ]);
      expect(resolveUnit('GPa', codeMappings)).to.deep.equal({
        iri: QUDT + 'MegaPA'
      });
      expect(resolveCodeMapping('GPa', codeMappings)).to.equal(
        QUDT + 'MegaPA'
      );
    });

    it('leaves a non-QUDT row address unlinked over a QUDT match', function () {
      const codeMappings = new Map([
        ['gpa', { uri: 'http://example.org/my-gpa', label: '' }]
      ]);
      const result = resolveUnit('GPa', codeMappings);
      expect(result).to.not.have.property('iri');
      expect(result.issue.code).to.equal('UNIT_NOT_QUDT');
      expect(result.issue.value).to.equal('http://example.org/my-gpa');
      expect(resolveCodeMapping('GPa', codeMappings)).to.equal(undefined);
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
      const attr = result[0]['sio:SIO_000008'][0];
      expect(attr['sio:SIO_000221']).to.deep.equal({ '@id': QUDT + 'GigaPA' });
      expect(attr['mm:hasUnitText']).to.equal('GPa');
    });
  });
});
