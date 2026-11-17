'use strict';

const { units } = require('../../config/qudt-units.json');
const overrides = require('../../config/qudt-unit-overrides.json');

const QUDT_UNIT = 'http://qudt.org/vocab/unit/';

/**
 * Read one table of the hand-kept unit overrides.
 * @param {string} key - 'aliases', 'tieBreaks' or 'notUnits'
 * @returns {Object|Array} The table
 */
function overrideFor (key) {
  return overrides[key];
}

const aliases = overrideFor('aliases');
const tieBreaks = overrideFor('tieBreaks');
const notUnits = new Set(overrideFor('notUnits'));

const own = (table, key) =>
  Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;

const addOwner = (map, key, name) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(name);
};

// Exact, case-sensitive spellings: unit keys and codes to their owners.
const exact = new Map();
// Case-folded spellings: unit keys, alias keys and tie-break keys.
const folded = new Map();
Object.entries(units).forEach(([name, { keys = [], codes = [] }]) => {
  keys.forEach((key) => {
    addOwner(exact, key, name);
    if (own(tieBreaks, key) || notUnits.has(key)) return;
    addOwner(folded, key.toLowerCase(), name);
  });
  codes.forEach((code) => addOwner(exact, code, name));
});
[aliases, tieBreaks].forEach((table) => {
  Object.entries(table).forEach(([key, name]) => {
    addOwner(folded, key.toLowerCase(), name);
  });
});

const fromOwners = (owners, value) => {
  if (owners.size === 1) return { iri: QUDT_UNIT + [...owners][0] };
  const names = [...owners].sort().join(', ');
  return {
    issue: {
      code: 'UNIT_AMBIGUOUS',
      message: `Unit "${value}" matches several QUDT units: ${names}`,
      value
    }
  };
};

/**
 * Link unit text to a QUDT unit: the trimmed text's exact match first,
 * then its case-folded match.
 * @param {string} text - The unit text as typed
 * @returns {Object} { iri }, { issue: { code, message, value } }, or {}
 */
function lookupUnit (text) {
  if (text == null) return {};
  const trimmed = String(text).trim();
  if (!trimmed || notUnits.has(trimmed)) return {};
  const target = own(aliases, trimmed) || own(tieBreaks, trimmed);
  if (target) return { iri: QUDT_UNIT + target };
  const owners = exact.get(trimmed) || folded.get(trimmed.toLowerCase());
  if (owners) return fromOwners(owners, text);
  return {
    issue: {
      code: 'UNIT_UNRESOLVED',
      message: `Unit "${text}" matches no QUDT unit`,
      value: text
    }
  };
}

module.exports = { lookupUnit, overrideFor };
