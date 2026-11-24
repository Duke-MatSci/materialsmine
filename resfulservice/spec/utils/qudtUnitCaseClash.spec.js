'use strict';

const { expect } = require('chai');
const { resolveCodeMapping } = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');

// Required on call, so a load failure fails only the rows that use it.
const lookupUnit = (text) =>
  require('../../src/utils/unit-lookup').lookupUnit(text);

const QUDT = 'http://qudt.org/vocab/unit/';

// Text a unit writes in that case links to it, or for pH to its
// tie-break unit, with no issue, whatever other units write in other cases.
const CASE_TWINS = [
  ['V/V', 'V-PER-V'],
  ['ph', 'PHOT'],
  ['m', 'M'],
  ['nm', 'NanoM'],
  ['pm', 'PicoM'],
  ['μm', 'MicroM'],
  ['s', 'SEC'],
  ['T', 'T'],
  ['nA', 'NanoA'],
  ['RAD', 'RAD_R'],
  ['Rad', 'RAD_R'],
  ['mRAD', 'MilliRAD_R'],
  ['pH', 'PH']
];

// Case variants that no unit writes as they stand.
const UNRESOLVED = [
  'na',
  'Na',
  'v/v',
  'v/V',
  'V/v',
  'PH',
  'Ph',
  'None',
  'NONE',
  'N/a',
  'n/A'
];

describe('QUDT unit text and its case variants', function () {
  describe('text a unit writes in that case', function () {
    CASE_TWINS.forEach(([text, localName]) => {
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

    it('links the trimmed text and reports no issue', function () {
      expect(lookupUnit(' V/V ')).to.deep.equal({ iri: QUDT + 'V-PER-V' });
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

  describe('text no unit writes in that case', function () {
    UNRESOLVED.forEach((text) => {
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
});
