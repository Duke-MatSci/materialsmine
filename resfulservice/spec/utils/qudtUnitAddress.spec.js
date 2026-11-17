'use strict';

const { expect } = require('chai');
const {
  resolveCodeMapping,
  generateAttributes
} = require('../../src/utils/sdd-serializer');
const { mapUnit } = require('../../src/utils/curation-utility');
const { deprecated } = require('../../config/qudt-units.json');

// Required on call, so a load failure fails only the rows that use it.
const lookupUnit = (text) =>
  require('../../src/utils/unit-lookup').lookupUnit(text);
const resolveUnit = (code, codeMappings) =>
  require('../../src/utils/sdd-serializer').resolveUnit(code, codeMappings);

const QUDT = 'http://qudt.org/vocab/unit/';
const OM2_NANOMETRE =
  'http://www.ontology-of-units-of-measure.org/resource/om-2/Nanometre';

// A QUDT address naming a pinned unit links to it with no issue.
const LINKED = [
  ['http://qudt.org/vocab/unit/DEG_C', 'DEG_C'],
  ['unit:DEG_C', 'DEG_C'],
  ['unit:S-PER-CentiM', 'S-PER-CentiM'],
  ['unit:V-PER-CentiM', 'V-PER-CentiM'],
  ['unit:RAD-PER-MIN', 'RAD-PER-MIN'],
  ['http://qudt.org/vocab/unit/MegaV-PER-M', 'MegaV-PER-M'],
  ['unit:CI', 'CI'],
  // PA is a unit name, and also a text key of PetaA only.
  ['unit:PA', 'PA'],
  ['  unit:DEG_C  ', 'DEG_C']
];

// Legacy lowercase local names link to the one unit they fold to.
const FOLDED = [
  ['http://qudt.org/vocab/unit/j-per-gm', 'J-PER-GM'],
  ['http://qudt.org/vocab/unit/k-per-min', 'K-PER-MIN'],
  ['http://qudt.org/vocab/unit/per-k', 'PER-K'],
  ['unit:nanom', 'NanoM']
];

// Addresses that name no pinned QUDT unit, and every non-QUDT address.
const NOT_QUDT = [
  'http://qudt.org/vocab/unit/MegaV-PER-CentiM',
  'unit:',
  'unit:zorkmids',
  OM2_NANOMETRE,
  'http://www.ontology-of-units-of-measure.org/resource/om-2/degreeCelsius',
  'https://qudt.org/vocab/unit/DEG_C',
  'http://example.org/my-gpa',
  // GPa is a text key of GigaPA, but not a unit name.
  'unit:GPa',
  '  unit:zorkmids  '
];

describe('QUDT unit addresses', function () {
  describe('address text naming a pinned unit', function () {
    [...LINKED, ...FOLDED].forEach(([text, name]) => {
      it(`lookupUnit links '${text}' to unit:${name}`, function () {
        expect(lookupUnit(text)).to.deep.equal({ iri: QUDT + name });
      });

      it(`resolveUnit links '${text}' to unit:${name}`, function () {
        expect(resolveUnit(text, new Map())).to.deep.equal({
          iri: QUDT + name
        });
      });

      it(`resolveCodeMapping links '${text}' to unit:${name}`, function () {
        expect(resolveCodeMapping(text, new Map())).to.equal(QUDT + name);
      });

      it(`mapUnit links '${text}' to unit:${name}`, function () {
        expect(mapUnit(text)).to.equal(QUDT + name);
      });
    });
  });

  describe('deprecated unit with a replacement', function () {
    ['Gs', 'Ci'].forEach((name) => {
      const text = `unit:${name}`;
      const replacement = QUDT + deprecated[name];

      it(`lookupUnit links '${text}' to its replacement with a deprecation issue`, function () {
        const result = lookupUnit(text);
        expect(result.iri).to.equal(replacement);
        expect(result.issue.code).to.equal('UNIT_DEPRECATED');
        expect(result.issue.value).to.equal(text);
        expect(result.issue.message)
          .to.be.a('string')
          .that.includes(name)
          .and.includes(deprecated[name]);
      });

      it(`resolveUnit links '${text}' to its replacement with a deprecation issue`, function () {
        const result = resolveUnit(text, new Map());
        expect(result.iri).to.equal(replacement);
        expect(result.issue.code).to.equal('UNIT_DEPRECATED');
      });

      it(`resolveCodeMapping links '${text}' to its replacement`, function () {
        expect(resolveCodeMapping(text, new Map())).to.equal(replacement);
      });

      it(`mapUnit links '${text}' to its replacement`, function () {
        expect(mapUnit(text)).to.equal(replacement);
      });
    });

    it('takes the full-IRI form of a deprecated name too', function () {
      const result = lookupUnit(QUDT + 'Gs');
      expect(result.iri).to.equal(QUDT + deprecated.Gs);
      expect(result.issue.code).to.equal('UNIT_DEPRECATED');
    });
  });

  describe('deprecated unit with no replacement', function () {
    const text = 'unit:PIXEL';

    it(`lookupUnit leaves '${text}' unlinked with a deprecation issue`, function () {
      const result = lookupUnit(text);
      expect(result).to.not.have.property('iri');
      expect(result.issue.code).to.equal('UNIT_DEPRECATED');
      expect(result.issue.value).to.equal(text);
      expect(result.issue.message).to.be.a('string').that.includes('PIXEL');
    });

    it(`resolveUnit leaves '${text}' unlinked with a deprecation issue`, function () {
      const result = resolveUnit(text, new Map());
      expect(result).to.not.have.property('iri');
      expect(result.issue.code).to.equal('UNIT_DEPRECATED');
    });

    it(`resolveCodeMapping leaves '${text}' unlinked`, function () {
      expect(resolveCodeMapping(text, new Map())).to.equal(undefined);
    });

    it(`mapUnit leaves '${text}' unlinked`, function () {
      expect(mapUnit(text)).to.equal(null);
    });
  });

  describe('address that is not a pinned QUDT unit', function () {
    NOT_QUDT.forEach((text) => {
      it(`lookupUnit reports '${text}' as not QUDT`, function () {
        const result = lookupUnit(text);
        expect(result).to.not.have.property('iri');
        expect(result.issue.code).to.equal('UNIT_NOT_QUDT');
        expect(result.issue.value).to.equal(text);
        expect(result.issue.message).to.be.a('string').that.is.not.empty;
      });

      it(`resolveUnit reports '${text}' as not QUDT`, function () {
        const result = resolveUnit(text, new Map());
        expect(result).to.not.have.property('iri');
        expect(result.issue.code).to.equal('UNIT_NOT_QUDT');
        expect(result.issue.value).to.equal(text);
      });

      it(`resolveCodeMapping leaves '${text}' unlinked`, function () {
        expect(resolveCodeMapping(text, new Map())).to.equal(undefined);
      });

      it(`mapUnit leaves '${text}' unlinked`, function () {
        expect(mapUnit(text)).to.equal(null);
      });
    });
  });

  describe('unit: prefix is case-sensitive', function () {
    it("lookupUnit treats 'Unit:NanoM' as unit text, not an address", function () {
      expect(lookupUnit('Unit:NanoM').issue.code).to.equal('UNIT_UNRESOLVED');
    });
  });

  describe('Code Mappings row address', function () {
    // Keys are lowercased and trimmed, as parseCodeMappingsSheet makes them.
    const sheet = (key, uri) => new Map([[key, { uri, label: '' }]]);

    it('links a full QUDT IRI', function () {
      const cm = sheet('nm', QUDT + 'NanoM');
      expect(resolveUnit('nm', cm)).to.deep.equal({ iri: QUDT + 'NanoM' });
      expect(resolveCodeMapping('nm', cm)).to.equal(QUDT + 'NanoM');
    });

    it('links a unit: short form as the full IRI', function () {
      const cm = sheet('nm', 'unit:NanoM');
      expect(resolveUnit('nm', cm)).to.deep.equal({ iri: QUDT + 'NanoM' });
      expect(resolveCodeMapping('nm', cm)).to.equal(QUDT + 'NanoM');
    });

    it('leaves an OM-2 address unlinked, with no fallback to the typed text', function () {
      const cm = sheet('nm', OM2_NANOMETRE);
      const result = resolveUnit('nm', cm);
      expect(result).to.not.have.property('iri');
      expect(result.issue.code).to.equal('UNIT_NOT_QUDT');
      expect(result.issue.value).to.equal(OM2_NANOMETRE);
      expect(resolveCodeMapping('nm', cm)).to.equal(undefined);
    });

    it('leaves a value that is not an address unlinked', function () {
      const cm = sheet('nm', 'NanoM');
      const result = resolveUnit('nm', cm);
      expect(result).to.not.have.property('iri');
      expect(result.issue.code).to.equal('UNIT_NOT_QUDT');
      expect(result.issue.value).to.equal('NanoM');
      expect(resolveCodeMapping('nm', cm)).to.equal(undefined);
    });

    it('links a deprecated address to its replacement with a deprecation issue', function () {
      const cm = sheet('x', 'unit:Ci');
      const result = resolveUnit('x', cm);
      expect(result.iri).to.equal(QUDT + deprecated.Ci);
      expect(result.issue.code).to.equal('UNIT_DEPRECATED');
      expect(result.issue.value).to.equal('unit:Ci');
      expect(resolveCodeMapping('x', cm)).to.equal(QUDT + deprecated.Ci);
    });

    it('wins over address text that is also its code', function () {
      const cm = sheet('unit:nanom', 'unit:MegaPA');
      expect(resolveUnit('unit:NanoM', cm)).to.deep.equal({
        iri: QUDT + 'MegaPA'
      });
      expect(resolveCodeMapping('unit:NanoM', cm)).to.equal(QUDT + 'MegaPA');
    });
  });

  describe('generateAttributes', function () {
    const npId = 'http://materialsmine.org/np/test123';
    const dict = (unit) => [
      {
        column: 'Width',
        label: '',
        comment: '',
        definition: '',
        attribute: 'sio:Width',
        attributeOf: '',
        unit,
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
    const csvRows = [{ Width: '50' }];
    const hasUnit = (unit, codeMappings) =>
      generateAttributes(csvRows, dict(unit), npId, 0, codeMappings)[0][
        'sio:hasAttribute'
      ][0]['sio:hasUnit'];

    it('links a unit: address cell to the full IRI and keeps the typed text', function () {
      expect(hasUnit('unit:NanoM', new Map())).to.deep.equal([
        { '@type': QUDT + 'NanoM', '@value': 'unit:NanoM' }
      ]);
    });

    it('links a sheet row unit: address as the full IRI', function () {
      const cm = new Map([['nm', { uri: 'unit:NanoM', label: '' }]]);
      expect(hasUnit('nm', cm)).to.deep.equal([
        { '@type': QUDT + 'NanoM', '@value': 'nm' }
      ]);
    });
  });
});
