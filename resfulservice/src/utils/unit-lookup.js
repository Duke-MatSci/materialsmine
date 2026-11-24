'use strict';

const { units, deprecated } = require('../../config/qudt-units.json');
const {
  OUTPUT_CONTEXT: { unit: QUDT_UNIT }
} = require('../../config/constant');

/**
 * Read the hand-kept unit overrides. This is the only reader of
 * config/qudt-unit-overrides.json.
 * @returns {Object} { tieBreaks }: colliding QUDT text to the local name
 *   of the one owner it links
 */
function readUnitOverrides () {
  return require('../../config/qudt-unit-overrides.json');
}

const { tieBreaks } = readUnitOverrides();

const has = (table, key) => Object.prototype.hasOwnProperty.call(table, key);
const own = (table, key) => (has(table, key) ? table[key] : undefined);

// Exact, case-sensitive spellings: unit keys and codes to their owners.
const exact = new Map();
Object.entries(units).forEach(([name, { keys = [], codes = [] }]) => {
  [...keys, ...codes].forEach((key) => {
    if (!exact.has(key)) exact.set(key, new Set());
    exact.get(key).add(name);
  });
});

const issue = (code, message, value) => ({ issue: { code, message, value } });

// One owner links; more are ambiguous.
const fromOwners = (owners, value) => {
  if (owners.size === 1) return { iri: QUDT_UNIT + [...owners][0] };
  const names = [...owners].sort().join(', ');
  return issue(
    'UNIT_AMBIGUOUS',
    `Unit "${value}" matches several QUDT units: ${names}`,
    value
  );
};

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
 * exactly, else a deprecated name exactly, which links to its replacement
 * with a UNIT_DEPRECATED issue. Anything else, including a name differing
 * only in case, gives a UNIT_NOT_QUDT issue.
 * @param {string} text - The address as written
 * @returns {Object} { iri }, { iri, issue }, or { issue }
 */
function lookupAddress (text) {
  const name = localName(String(text).trim());
  if (!name) return notQudt(text);
  if (has(units, name)) return { iri: QUDT_UNIT + name };
  // A deprecated name may map to null: QUDT gives it no replacement.
  if (has(deprecated, name)) return fromDeprecated(name, text);
  return notQudt(text);
}

/**
 * Link unit text to a QUDT unit. Matching is exact and case-sensitive,
 * against strings QUDT itself writes. The trimmed text is tried against
 * these rules in order, and the first that applies decides:
 * - blank text gives {};
 * - an address goes to lookupAddress;
 * - a tie-break key links its target;
 * - a qudt:symbol, qudt:altSymbol, qudt:ucumCode, qudt:udunitsCode or
 *   English rdfs:label or skos:altLabel value links its one owner, else is
 *   UNIT_AMBIGUOUS;
 * - anything else gives UNIT_UNRESOLVED.
 * @param {string} text - The unit text as typed
 * @returns {Object} { iri }, { iri, issue }, { issue: { code, message, value } },
 *   or {}
 */
function lookupUnit (text) {
  if (text == null) return {};
  const trimmed = String(text).trim();
  if (!trimmed) return {};
  if (isAddress(trimmed)) return lookupAddress(text);
  const target = own(tieBreaks, trimmed);
  if (target) return { iri: QUDT_UNIT + target };
  const owners = exact.get(trimmed);
  if (owners) return fromOwners(owners, text);
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
