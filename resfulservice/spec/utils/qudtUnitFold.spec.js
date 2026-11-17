'use strict';

const { expect } = require('chai');
const { resolveCodeMapping } = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');

// Required on call, so a load failure fails only the rows that use it.
const lookupUnit = (text) =>
  require('../../src/utils/unit-lookup').lookupUnit(text);

const QUDT = 'http://qudt.org/vocab/unit/';

// No exact match, but ignoring case exactly one unit has a key, alias or
// tie-break that folds to the text, and no not-a-unit value does: link to that unit.
const ONE_UNIT_FOLDS = [
  ['hz', 'HZ'],
  ['kv', 'KiloV'],
  ['KV', 'KiloV'],
  ['\u00b0c', 'DEG_C'],
  ['k', 'K'],
  ['gpa', 'GigaPA'],
  ['GPA', 'GigaPA'],
  ['KPa', 'KiloPA'],
  ['Celsius', 'DEG_C'],
  ['c', 'C'],
  ['unitless', 'UNITLESS'],
  ['mg/ml', 'MilliGM-PER-MilliL'],
  ['foot', 'FT'],
  ['inches', 'IN']
];

// Hand-kept aliases supply common spellings that QUDT does not.
const ALIASES = [
  ['wt%', 'PERCENT'],
  ['wt.%', 'PERCENT'],
  ['w/w', 'PERCENT'],
  ['mass%', 'PERCENT'],
  ['vol%', 'PERCENT'],
  ['v/v', 'PERCENT'],
  ['celsius', 'DEG_C'],
  ['celcius', 'DEG_C'],
  ['deg C', 'DEG_C'],
  ['celsius/min', 'DEG_C-PER-MIN'],
  ['celsius/minute', 'DEG_C-PER-MIN'],
  ['hr', 'HR'],
  ['\u00b5m', 'MicroM'],
  ['1/s', 'PER-SEC'],
  ['1/cm', 'PER-CentiM'],
  ['g/cc', 'GM-PER-CentiM3'],
  ['M', 'MOL-PER-L'],
  ['nM', 'NanoMOL-PER-L'],
  ['\u00b5M', 'MicroMOL-PER-L'],
  ['\u03bcM', 'MicroMOL-PER-L'],
  ['pM', 'PicoMOL-PER-L']
];

const GROUPS = [
  ['case-folded match to one unit', ONE_UNIT_FOLDS],
  ['hand-kept aliases', ALIASES]
];

// Text that several units match: the issue names every candidate.
const AMBIGUOUS = [
  ['pa', ['PA', 'PetaA', 'PicoA']],
  ['mv', ['MegaV', 'MilliV']],
  ['mpa', ['MegaPA', 'MilliPA']],
  ['cal', ['CAL_IT', 'CAL_TH']],
  ['B', ['B', 'BREWSTER', 'BYTE']]
];

// Text that no unit matches, exactly or folded.
const UNRESOLVED = [
  'g/cm3',
  'g/cm^3',
  'A/m^2',
  'a/m^2',
  'g cm-3',
  'GP',
  'kJ/m\u00b2',
  'kV/mm'
];

describe('QUDT case-folded unit lookup', function () {
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

  describe('text that several units match', function () {
    AMBIGUOUS.forEach(([text, candidates]) => {
      it(`lookupUnit reports '${text}' as ambiguous among ${candidates.join(', ')}`, function () {
        const { issue } = lookupUnit(text);
        expect(issue.code).to.equal('UNIT_AMBIGUOUS');
        expect(issue.value).to.equal(text);
        expect(issue.message).to.be.a('string');
        candidates.forEach((name) => {
          expect(issue.message).to.include(name);
        });
      });

      it(`resolveCodeMapping leaves '${text}' unlinked`, function () {
        expect(resolveCodeMapping(text, new Map())).to.equal(undefined);
      });

      it(`mapUnit leaves '${text}' unlinked`, function () {
        expect(mapUnit(text)).to.equal(null);
      });
    });
  });

  describe('text that no unit matches', function () {
    UNRESOLVED.forEach((text) => {
      it(`lookupUnit reports '${text}' as unresolved`, function () {
        const { issue } = lookupUnit(text);
        expect(issue.code).to.equal('UNIT_UNRESOLVED');
        expect(issue.value).to.equal(text);
        expect(issue.message).to.be.a('string').that.is.not.empty;
      });

      it(`resolveCodeMapping leaves '${text}' unlinked`, function () {
        expect(resolveCodeMapping(text, new Map())).to.equal(undefined);
      });

      it(`mapUnit leaves '${text}' unlinked`, function () {
        expect(mapUnit(text)).to.equal(null);
      });
    });

    it('reports the text as it was given, before trimming', function () {
      const { issue } = lookupUnit(' kV/mm ');
      expect(issue.code).to.equal('UNIT_UNRESOLVED');
      expect(issue.value).to.equal(' kV/mm ');
    });
  });
});
