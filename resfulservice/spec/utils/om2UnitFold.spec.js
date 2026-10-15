'use strict';

const { expect } = require('chai');
const { resolveCodeMapping } = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');

const OM2 = 'http://www.ontology-of-units-of-measure.org/resource/om-2/';

// No exact match, but ignoring case exactly one unit has a key that folds
// to the code: link to that unit.
const ONE_UNIT_FOLDS = [
  ['hz', 'hertz'],
  ['kv', 'kilovolt'],
  ['KV', 'kilovolt'],
  ['\u00b0c', 'degreeCelsius'],
  ['k', 'kelvin'],
  ['gpa', 'gigapascal'],
  ['GPA', 'gigapascal'],
  ['s/m', 'siemensPerMetre'],
  ['Celsius', 'degreeCelsius'],
  ['a/m^2', 'amperePerSquareMetre']
];

// Hand-kept aliases supply common spellings that are neither OM-2 symbols
// nor names generated from OM-2 labels.
const ALIASES = [
  ['hr', 'hour'],
  ['celsius', 'degreeCelsius'],
  ['celcius', 'degreeCelsius'],
  ['celsius/min', 'degreeCelsiusPerMinute-Time'],
  ['celsius/minute', 'degreeCelsiusPerMinute-Time'],
  ['um', 'micrometre'],
  ['\u00b5m', 'micrometre'],
  ['cm-1', 'kayser'],
  ['1/s', 'reciprocalSecond-Time'],
  ['g/cm^3', 'gramPerCubicCentimetre'],
  ['A/m^2', 'amperePerSquareMetre'],
  ['mL', 'millilitre'],
  ['wt%', 'percent'],
  ['wt.%', 'percent'],
  ['w/w', 'percent'],
  ['mass%', 'percent'],
  ['vol%', 'percent'],
  ['v/v', 'percent']
];

const GROUPS = [
  ['case-folded match to one unit', ONE_UNIT_FOLDS],
  ['hand-kept aliases', ALIASES]
];

// Codes that fold to several units, or to none, stay unlinked.
const UNLINKED = [
  'pa',
  'mv',
  'mpa',
  'ML',
  'RAD',
  'N/A',
  '-',
  'none',
  'unitless'
];

describe('OM-2 case-folded unit lookup', function () {
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

  describe('ambiguous or unknown codes', function () {
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
