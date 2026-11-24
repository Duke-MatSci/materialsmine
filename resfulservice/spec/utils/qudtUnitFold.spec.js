'use strict';

const { expect } = require('chai');
const { resolveCodeMapping } = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');

// Required on call, so a load failure fails only the rows that use it.
const lookupUnit = (text) =>
  require('../../src/utils/unit-lookup').lookupUnit(text);

// Text that QUDT does not write in this case, if at all.
const CASE_VARIANTS = [
  'hz',
  'kv',
  'KV',
  '\u00b0c',
  'k',
  'gpa',
  'GPA',
  'KPa',
  'Celsius',
  'c',
  'unitless',
  'mg/ml',
  'foot',
  'inches',
  'pa',
  'mv',
  'mpa'
];

// Common spellings that QUDT does not write, including the micro sign
// U+00B5 where QUDT writes the Greek mu U+03BC.
const NOT_QUDT_SPELLINGS = [
  'wt%',
  'wt.%',
  'w/w',
  'mass%',
  'vol%',
  'v/v',
  'celsius',
  'celcius',
  'deg C',
  'celsius/min',
  'celsius/minute',
  'hr',
  '\u00b5m',
  '1/s',
  '1/cm',
  'g/cc',
  'M',
  'nM',
  '\u00b5M',
  '\u03bcM',
  'pM'
];

// Text that several units write, with no tie-break: the issue names every
// candidate.
const AMBIGUOUS = [
  ['cal', ['CAL_IT', 'CAL_TH']],
  ['B', ['B', 'BREWSTER', 'BYTE']]
];

// Text that no unit writes exactly.
const UNRESOLVED = [
  ...CASE_VARIANTS,
  ...NOT_QUDT_SPELLINGS,
  'g/cm3',
  'g/cm^3',
  'A/m^2',
  'a/m^2',
  'g cm-3',
  'GP',
  'kJ/m\u00b2',
  'kV/mm'
];

describe('QUDT unit text that does not link', function () {
  describe('text that several units match', function () {
    AMBIGUOUS.forEach(([text, candidates]) => {
      it(`lookupUnit reports '${text}' as ambiguous among ${candidates.join(', ')}`, function () {
        const { issue } = lookupUnit(text);
        expect(issue, 'issue').to.exist;
        expect(issue.code).to.equal('UNIT_AMBIGUOUS');
        expect(issue.value).to.equal(text);
        expect(issue.message).to.equal(
          `Unit "${text}" matches several QUDT units: ${candidates.join(', ')}`
        );
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
        expect(issue, 'issue').to.exist;
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
