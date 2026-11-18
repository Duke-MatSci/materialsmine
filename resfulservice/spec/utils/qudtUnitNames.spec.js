'use strict';

const { expect } = require('chai');
const { resolveCodeMapping } = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');

// Required on call, so a load failure fails only the rows that use it.
const lookupUnit = (text) =>
  require('../../src/utils/unit-lookup').lookupUnit(text);

const QUDT = 'http://qudt.org/vocab/unit/';

// A unit typed by name links, in any case, through the names QUDT's
// English labels give it.
const NAMES = [
  ['micrometers', 'MicroM'],
  ['micrometer', 'MicroM'],
  ['degrees Celsius', 'DEG_C'],
  ['MEGAPASCAL', 'MegaPA'],
  ['megapascal', 'MegaPA'],
  ['gigapascals', 'GigaPA'],
  ['siemens per meter', 'S-PER-M'],
  ['metres per second', 'M-PER-SEC'],
  ['millilitres', 'MilliL'],
  ['milliliters', 'MilliL'],
  ['grams per cubic centimetre', 'GM-PER-CentiM3'],
  ['seconds', 'SEC'],
  ['parsecs', 'PARSEC'],
  ['hours', 'HR'],
  ['hour', 'HR'],
  ['minutes', 'MIN'],
  ['minute', 'MIN'],
  ['days', 'DAY'],
  ['weeks', 'WK']
];

// Names that are no unit's label, nor a variant of one, stay unlinked.
const UNRESOLVED = ['zorkmids', 'furlongs per fortnight', 'feet'];

describe('QUDT unit lookup by name', function () {
  describe('names from QUDT English labels', function () {
    NAMES.forEach(([text, localName]) => {
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

  describe('names with no QUDT label', function () {
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
  });
});
