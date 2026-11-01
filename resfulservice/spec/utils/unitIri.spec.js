'use strict';

const { expect } = require('chai');
const { resolveCodeMapping } = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');

const OM2 = 'http://www.ontology-of-units-of-measure.org/resource/om-2/';

// Unit code -> local name of the OM-2 2.0 unit individual it denotes.
const EXPECTED = [
  ['%', 'percent'],
  ['1/s', 'reciprocalSecond-Time'],
  ['A/m^2', 'amperePerSquareMetre'],
  ['C', 'coulomb'],
  ['Celsius', 'degreeCelsius'],
  ['celcius', 'degreeCelsius'],
  ['°C', 'degreeCelsius'],
  ['Celsius/min', 'degreeCelsiusPerMinute-Time'],
  ['Celsius/minute', 'degreeCelsiusPerMinute-Time'],
  ['days', 'day'],
  ['nm', 'nanometre'],
  ['hours', 'hour'],
  ['hour', 'hour'],
  ['hr', 'hour'],
  ['minutes', 'minute-Time'],
  ['minute', 'minute-Time'],
  ['min', 'minute-Time'],
  ['kV', 'kilovolt'],
  ['g/cm^3', 'gramPerCubicCentimetre'],
  ['um', 'micrometre'],
  ['Hz', 'hertz'],
  ['cm-1', 'kayser'],
  ['Pa', 'pascal']
];

describe('Built-in unit codes', function () {
  // The SDD path falls back to the shared unit lookup when the SDD's own
  // code mappings are empty.
  describe('resolveCodeMapping with no code mappings', function () {
    EXPECTED.forEach(([code, localName]) => {
      it(`should resolve '${code}' to om-2/${localName}`, function () {
        expect(resolveCodeMapping(code, new Map())).to.equal(OM2 + localName);
      });
    });
  });

  // The XML curation path maps units through the same lookup.
  describe('mapUnit', function () {
    EXPECTED.forEach(([code, localName]) => {
      it(`should map '${code}' to om-2/${localName}`, function () {
        expect(mapUnit(code)).to.equal(OM2 + localName);
      });
    });
  });
});
