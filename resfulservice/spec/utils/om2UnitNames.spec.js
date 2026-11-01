'use strict';

const { expect } = require('chai');
const { resolveCodeMapping } = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');

const OM2 = 'http://www.ontology-of-units-of-measure.org/resource/om-2/';

// A unit typed by name links, in any case, when it is the unit's OM-2
// English label, its US spelling, or either with the first word plural.
const NAMES = [
  ['micrometers', 'micrometre'],
  ['micrometer', 'micrometre'],
  ['Micrometre', 'micrometre'],
  ['degrees Celsius', 'degreeCelsius'],
  ['MEGAPASCAL', 'megapascal'],
  ['megapascal', 'megapascal'],
  ['gigapascals', 'gigapascal'],
  ['siemens per meter', 'siemensPerMetre'],
  ['Kelvin', 'kelvin'],
  ['metres per second', 'metrePerSecond-Time'],
  ['millilitres', 'millilitre'],
  ['milliliters', 'millilitre'],
  ['grams per cubic centimetre', 'gramPerCubicCentimetre'],
  ['seconds', 'second-Time'],
  ['parsecs', 'parsec']
];

// Names that linked before label-generated names existed keep linking.
const KEPT = [
  ['hours', 'hour'],
  ['minutes', 'minute-Time'],
  ['days', 'day'],
  ['hour', 'hour'],
  ['minute', 'minute-Time']
];

const GROUPS = [
  ['names from OM-2 English labels', NAMES],
  ['names that already linked', KEPT]
];

// Names that are no unit's label, nor a variant of one, stay unlinked.
const UNLINKED = [
  'zorkmids',
  'furlongs per fortnight',
  'foot',
  'feet',
  'inches'
];

describe('OM-2 unit lookup by name', function () {
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

  describe('names with no OM-2 label', function () {
    UNLINKED.forEach((code) => {
      it(`resolveCodeMapping leaves '${code}' unlinked`, function () {
        expect(resolveCodeMapping(code, new Map())).to.equal(undefined);
      });

      it(`mapUnit leaves '${code}' unlinked`, function () {
        expect(mapUnit(code)).to.equal(null);
      });
    });
  });
});
