'use strict';

const { units, deprecated } = require('../../config/qudt-units.json');
const {
  OUTPUT_CONTEXT: { unit: QUDT_UNIT }
} = require('../../config/constant');

/**
 * Read the hand-kept unit overrides. This is the only reader of
 * config/qudt-unit-overrides.json; the matching below gets its tables from
 * here alone.
 * @returns {Object} { aliases, tieBreaks, notUnits, caseClashes }: aliases
 *   and tieBreaks map unit text to a QUDT local name, notUnits lists text
 *   that is not a unit, and caseClashes lists exact spellings that differ
 *   only in case from an alias or tie-break naming another unit
 */
function readUnitOverrides () {
  return require('../../config/qudt-unit-overrides.json');
}

const {
  aliases,
  tieBreaks,
  notUnits: notUnitList,
  caseClashes
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
notUnitList.forEach((value) => {
  addOwner(foldedNotUnits, value.toLowerCase(), value);
});

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

const plural = (word, count) => (count === 1 ? word : word + 's');

const ambiguity = (owners, value, notUnitValues) => {
  const names = [...owners].sort().join(', ');
  if (!notUnitValues.length) {
    return `Unit "${value}" matches several QUDT units: ${names}`;
  }
  const units = plural('QUDT unit', owners.size);
  const texts = plural('not-a-unit text', notUnitValues.length);
  const quoted = notUnitValues.map((v) => `"${v}"`).join(', ');
  return `Unit "${value}" matches ${units} ${names} and the ${texts} ${quoted}`;
};

// One owner and no not-a-unit value links; anything more is ambiguous.
const fromOwners = (owners, value, notUnitValues = []) => {
  if (owners.size === 1 && !notUnitValues.length) {
    return { iri: QUDT_UNIT + [...owners][0] };
  }
  return issue(
    'UNIT_AMBIGUOUS',
    ambiguity(owners, value, notUnitValues),
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
 * Link unit text to a QUDT unit. The trimmed text is tried against these
 * rules in order, and the first that applies decides:
 * - blank text, or text equal to a notUnits value, gives {};
 * - an address goes to lookupAddress;
 * - an alias or tie-break key links its target;
 * - a caseClashes spelling gives UNIT_AMBIGUOUS, naming the units it is an
 *   exact key or code of and the targets of its case-twin overrides;
 * - an exact unit key or code links its one owner, else is UNIT_AMBIGUOUS;
 * - a case-folded unit, alias or tie-break key links its one owner; more
 *   owners, or a notUnits value folding to the same text, give
 *   UNIT_AMBIGUOUS, naming every candidate;
 * - anything else gives UNIT_UNRESOLVED.
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
  if (clashes.has(trimmed)) return fromOwners(clashes.get(trimmed), text);
  const exactOwners = exact.get(trimmed);
  if (exactOwners) return fromOwners(exactOwners, text);
  const lower = trimmed.toLowerCase();
  const owners = folded.get(lower);
  const notUnitValues = [...(foldedNotUnits.get(lower) || [])].sort();
  if (owners) return fromOwners(owners, text, notUnitValues);
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
