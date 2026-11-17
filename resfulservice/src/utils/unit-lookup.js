'use strict';

const { units, deprecated } = require('../../config/qudt-units.json');
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

const {
  aliases,
  tieBreaks,
  notUnits: notUnitList,
  caseClashes = []
} = readUnitOverrides();
const notUnits = new Set(notUnitList);

const has = (table, key) => Object.prototype.hasOwnProperty.call(table, key);
const own = (table, key) => (has(table, key) ? table[key] : undefined);

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
    if (has(tieBreaks, key) || notUnits.has(key)) return;
    addOwner(folded, key.toLowerCase(), name);
  });
  codes.forEach((code) => addOwner(exact, code, name));
});
[aliases, tieBreaks].forEach((table) => {
  Object.entries(table).forEach(([key, name]) => {
    addOwner(folded, key.toLowerCase(), name);
  });
});

// Not-a-unit values by their lowercased spelling.
const foldedNotUnits = new Map();
notUnitList.forEach((value) => addOwner(foldedNotUnits, value.toLowerCase(), value));

// Listed spellings to the units they and their override case-twins name.
const clashes = new Map();
caseClashes.forEach((spelling) => {
  const owners = new Set(exact.get(spelling) || []);
  [aliases, tieBreaks].forEach((table) => {
    Object.entries(table).forEach(([key, name]) => {
      if (key.toLowerCase() === spelling.toLowerCase()) owners.add(name);
    });
  });
  clashes.set(spelling, owners);
});

const issue = (code, message, value) => ({ issue: { code, message, value } });

const fromOwners = (owners, value, others = []) => {
  if (owners.size === 1 && !others.length) {
    return { iri: QUDT_UNIT + [...owners][0] };
  }
  const names = [...owners].sort().join(', ');
  const notUnitText = others.length
    ? ` and the not-a-unit text ${others.map((v) => `"${v}"`).join(', ')}`
    : '';
  return issue(
    'UNIT_AMBIGUOUS',
    `Unit "${value}" matches several QUDT units: ${names}${notUnitText}`,
    value
  );
};

// Current unit names by their lowercased spelling; none collide.
const foldedNames = new Map(
  Object.keys(units).map((name) => [name.toLowerCase(), name])
);

const SHORT_PREFIX = 'unit:';

// A QUDT unit IRI is one kind of http address.
const isAddress = (text) =>
  text.startsWith(SHORT_PREFIX) || /^https?:\/\//.test(text);

const localName = (text) => {
  if (text.startsWith(QUDT_UNIT)) return text.slice(QUDT_UNIT.length);
  if (text.startsWith(SHORT_PREFIX)) return text.slice(SHORT_PREFIX.length);
  return null;
};

const notQudt = (text) =>
  issue('UNIT_NOT_QUDT', `Unit address "${text}" is not a QUDT unit`, text);

const fromDeprecated = (name, text) => {
  const replacement = deprecated[name];
  if (!replacement) {
    return issue(
      'UNIT_DEPRECATED',
      `Unit "${name}" is deprecated in QUDT, which gives no replacement`,
      text
    );
  }
  return {
    iri: QUDT_UNIT + replacement,
    ...issue(
      'UNIT_DEPRECATED',
      `Unit "${name}" is deprecated in QUDT; linked to ${replacement}`,
      text
    )
  };
};

/**
 * Link a unit address to a QUDT unit. Only a full QUDT unit IRI or a
 * `unit:` short form links. Its local name matches a pinned unit name
 * exactly, then a deprecated name, which links to its replacement with a
 * UNIT_DEPRECATED issue, then a pinned unit name case-folded. Anything
 * else gives a UNIT_NOT_QUDT issue.
 * @param {string} text - The address as written
 * @returns {Object} { iri }, { iri, issue }, or { issue }
 */
function lookupAddress (text) {
  const name = localName(String(text).trim());
  if (!name) return notQudt(text);
  if (has(units, name)) return { iri: QUDT_UNIT + name };
  // A deprecated name may map to null: QUDT gives it no replacement.
  if (has(deprecated, name)) return fromDeprecated(name, text);
  const caseMatch = foldedNames.get(name.toLowerCase());
  if (caseMatch) return { iri: QUDT_UNIT + caseMatch };
  return notQudt(text);
}

/**
 * Link unit text to a QUDT unit. Blank text and the notUnits texts give {}.
 * An address goes to lookupAddress; other text takes the trimmed text's
 * alias or tie-break first, then its exact match, then its case-folded match.
 * @param {string} text - The unit text as typed
 * @returns {Object} { iri }, { iri, issue }, { issue: { code, message, value } },
 *   or {}
 */
function lookupUnit (text) {
  if (text == null) return {};
  const trimmed = String(text).trim();
  if (!trimmed || notUnits.has(trimmed)) return {};
  if (isAddress(trimmed)) return lookupAddress(text);
  const target = own(aliases, trimmed) || own(tieBreaks, trimmed);
  if (target) return { iri: QUDT_UNIT + target };
  if (clashes.has(trimmed)) return fromOwners(clashes.get(trimmed), text, []);
  const exactOwners = exact.get(trimmed);
  if (exactOwners) return fromOwners(exactOwners, text);
  const lower = trimmed.toLowerCase();
  const owners = folded.get(lower);
  const others = [...(foldedNotUnits.get(lower) || [])].sort();
  if (owners) return fromOwners(owners, text, others);
  return issue('UNIT_UNRESOLVED', `Unit "${text}" matches no QUDT unit`, text);
}

/**
 * Writes a unit onto a node: `sio:SIO_000221` (has unit) links `iri` when it is
 * given, and `mm:hasUnitText` holds the trimmed text. Blank text writes
 * nothing.
 */
function writeUnit (node, text, iri) {
  const typed = text == null ? '' : String(text).trim();
  if (!typed) return;
  if (iri) node['sio:SIO_000221'] = { '@id': iri };
  node['mm:hasUnitText'] = typed;
}

module.exports = { lookupUnit, lookupAddress, writeUnit };
