'use strict';

const { expect } = require('chai');
const { resolveCodeMapping } = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');

// Required on call, so a load failure fails only the rows that use it.
const lookupUnit = (text) =>
  require('../../src/utils/unit-lookup').lookupUnit(text);

const QUDT = 'http://qudt.org/vocab/unit/';

// A unit typed by an English label exactly as QUDT writes it links.
const LABELS = [
  ['Hour', 'HR'],
  ['Degree Celsius', 'DEG_C'],
  ['Micrometre', 'MicroM'],
  ['Micrometer', 'MicroM'],
  ['Kelvin', 'K'],
  ['litre', 'L'],
  ['Conventional Metre of Water', 'M_H2O']
];

// Names that are no QUDT label as written stay unlinked: other cases,
// plurals and US spellings that QUDT does not write itself.
const UNRESOLVED = [
  'micrometers',
  'micrometer',
  'degrees Celsius',
  'MEGAPASCAL',
  'megapascal',
  'gigapascals',
  'siemens per meter',
  'metres per second',
  'millilitres',
  'milliliters',
  'grams per cubic centimetre',
  'seconds',
  'parsecs',
  'hours',
  'hour',
  'minutes',
  'minute',
  'days',
  'weeks',
  'Hours',
  'Percents',
  'Micrometers',
  'Degrees Celsius',
  'liter',
  'Conventional Meter of Water',
  'zorkmids',
  'furlongs per fortnight',
  'feet'
];

describe('QUDT unit lookup by name', function () {
  describe('QUDT English labels as written', function () {
    LABELS.forEach(([text, localName]) => {
      it(`lookupUnit links '${text}' to unit:${localName} with no issue`, function () {
        expect(lookupUnit(text)).to.deep.equal({ iri: QUDT + localName });
      });

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

  describe('names with no QUDT label as written', function () {
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
  });
});
