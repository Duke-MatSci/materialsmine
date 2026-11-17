'use strict';

const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const { resolveCodeMapping } = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');

// Required on call, so a load failure fails only the rows that use it.
const lookupUnit = (text) =>
  require('../../src/utils/unit-lookup').lookupUnit(text);

const QUDT = 'http://qudt.org/vocab/unit/';
const CONFIG = path.join(__dirname, '..', '..', 'config');
const readConfig = (file) =>
  JSON.parse(fs.readFileSync(path.join(CONFIG, file), 'utf8'));

// True when the message names the local name as a whole word, so that PH
// is not found inside PHOT.
const names = (message, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\w-])${escaped}($|[^\\w-])`).test(message);
};

// Text that differs only in case from an override spelling and would
// otherwise link elsewhere: the issue names every candidate unit, and quotes
// each not-a-unit value it folds to.
const CASE_CLASHES = [
  ['V/V', ['V-PER-V', 'PERCENT'], []],
  ['ph', ['PHOT', 'PH'], []],
  ['na', ['NanoA'], ['NA']],
  ['Na', ['NanoA'], ['NA']]
];

// Case-twins of overrides that are not listed keep their exact link.
const UNLISTED_TWINS = [
  ['m', 'M'],
  ['nm', 'NanoM'],
  ['pm', 'PicoM'],
  ['\u03bcm', 'MicroM'],
  ['s', 'SEC'],
  ['T', 'T'],
  ['nA', 'NanoA'],
  ['RAD', 'RAD_R'],
  ['Rad', 'RAD_R'],
  ['mRAD', 'MilliRAD_R']
];

// The overrides that the listed spellings clash with still link.
const OVERRIDES = [
  ['v/v', 'PERCENT'],
  ['pH', 'PH']
];

// Fold variants of the listed spellings, already ambiguous.
const FOLD_VARIANTS = ['v/V', 'V/v', 'PH', 'Ph'];

// Text that folds to a not-a-unit value and to no unit.
const UNRESOLVED = ['None', 'NONE', 'N/a', 'n/A'];

const expectUnlinked = (text) => {
  it(`resolveCodeMapping leaves '${text}' unlinked`, function () {
    expect(resolveCodeMapping(text, new Map())).to.equal(undefined);
  });

  it(`mapUnit leaves '${text}' unlinked`, function () {
    expect(mapUnit(text)).to.equal(null);
  });
};

const expectLinked = ([text, localName]) => {
  it(`resolveCodeMapping links '${text}' to unit:${localName}`, function () {
    expect(resolveCodeMapping(text, new Map())).to.equal(QUDT + localName);
  });

  it(`mapUnit links '${text}' to unit:${localName}`, function () {
    expect(mapUnit(text)).to.equal(QUDT + localName);
  });
};

describe('QUDT unit text that clashes in case with an override', function () {
  describe('text that warns instead of linking', function () {
    CASE_CLASHES.forEach(([text, candidates, notUnits]) => {
      const among = candidates.join(', ');
      it(`lookupUnit reports '${text}' as ambiguous among ${among}`, function () {
        const { iri, issue } = lookupUnit(text);
        expect(iri).to.equal(undefined);
        expect(issue.code).to.equal('UNIT_AMBIGUOUS');
        expect(issue.value).to.equal(text);
        expect(issue.message).to.be.a('string');
        candidates.forEach((name) => {
          expect(names(issue.message, name), `${name} named`).to.equal(true);
        });
        notUnits.forEach((value) => {
          expect(issue.message).to.include(`"${value}"`);
        });
      });

      expectUnlinked(text);
    });

    it('reports the text as it was given, before trimming', function () {
      const { iri, issue } = lookupUnit(' V/V ');
      expect(iri).to.equal(undefined);
      expect(issue.code).to.equal('UNIT_AMBIGUOUS');
      expect(issue.value).to.equal(' V/V ');
    });

    it('lets a Code Mappings sheet row win on the SDD route', function () {
      const codeMappings = new Map([
        ['v/v', { uri: 'unit:PERCENT', label: '' }]
      ]);
      expect(resolveCodeMapping('V/V', codeMappings)).to.equal(
        QUDT + 'PERCENT'
      );
    });
  });

  describe('unlisted case-twins of overrides', function () {
    UNLISTED_TWINS.forEach(expectLinked);
  });

  describe('the overrides themselves', function () {
    OVERRIDES.forEach(expectLinked);
  });

  describe('fold variants of the listed spellings', function () {
    FOLD_VARIANTS.forEach((text) => {
      it(`lookupUnit reports '${text}' as ambiguous`, function () {
        expect(lookupUnit(text).issue.code).to.equal('UNIT_AMBIGUOUS');
      });

      expectUnlinked(text);
    });
  });

  describe('text that folds only to a not-a-unit value', function () {
    UNRESOLVED.forEach((text) => {
      it(`lookupUnit reports '${text}' as unresolved`, function () {
        const { issue } = lookupUnit(text);
        expect(issue.code).to.equal('UNIT_UNRESOLVED');
        expect(issue.value).to.equal(text);
      });

      expectUnlinked(text);
    });
  });
});

describe('QUDT unit overrides: caseClashes table', function () {
  const { aliases, tieBreaks, caseClashes } = readConfig(
    'qudt-unit-overrides.json'
  );
  const { units } = readConfig('qudt-units.json');
  const overrides = { ...aliases, ...tieBreaks };

  it('lists at least one spelling', function () {
    expect(caseClashes).to.be.an('array').that.is.not.empty;
  });

  (caseClashes || []).forEach((entry) => {
    const owners = Object.entries(units)
      .filter(([, { keys = [], codes = [] }]) =>
        keys.includes(entry) || codes.includes(entry)
      )
      .map(([name]) => name);
    const twins = Object.keys(overrides).filter(
      (key) => key !== entry && key.toLowerCase() === entry.toLowerCase()
    );

    it(`'${entry}' is an exact key or code of a unit`, function () {
      expect(owners).to.not.be.empty;
    });

    it(`'${entry}' has an override twin linking to another unit`, function () {
      const elsewhere = twins.filter((key) => !owners.includes(overrides[key]));
      expect(elsewhere).to.not.be.empty;
    });
  });
});
