'use strict';

const { units } = require('../../config/qudt-units.json');
const {
  OUTPUT_CONTEXT: { unit: QUDT_UNIT }
} = require('../../config/constant');

/**
 * Read the hand-kept unit overrides. This is the only reader of
 * config/qudt-unit-overrides.json; the matching below gets its tables from
 * here alone.
 * @returns {Object} { aliases, tieBreaks, notUnits }: aliases and tieBreaks
 *   map unit text to a QUDT local name, notUnits lists text that is not a unit
 */
function readUnitOverrides () {
  return require('../../config/qudt-unit-overrides.json');
}

const { aliases, tieBreaks, notUnits: notUnitList } = readUnitOverrides();
const notUnits = new Set(notUnitList);

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

const issue = (code, message, value) => ({ issue: { code, message, value } });

const fromOwners = (owners, value) => {
  if (owners.size === 1) return { iri: QUDT_UNIT + [...owners][0] };
  const names = [...owners].sort().join(', ');
  return issue(
    'UNIT_AMBIGUOUS',
    `Unit "${value}" matches several QUDT units: ${names}`,
    value
  );
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
  return issue('UNIT_UNRESOLVED', `Unit "${text}" matches no QUDT unit`, text);
}

module.exports = { lookupUnit };
