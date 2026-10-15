'use strict';

const { OM2, UNIT_IRI } = require('../../config/constant');
const { units } = require('../../config/om2-units.json');
const { tieBreaks } = require('../../config/om2-unit-overrides.json');

// Exact, case-sensitive keys: OM-2 symbols first, then tie-breaks over them.
const exact = new Map();
Object.entries(units).forEach(([name, keys]) => {
  keys.forEach((key) => exact.set(key, name));
});
Object.entries(tieBreaks).forEach(([key, name]) => exact.set(key, name));

/**
 * Resolve a unit code to an OM-2 unit IRI: the trimmed code's exact,
 * case-sensitive match first, else the case-insensitive UNIT_IRI table.
 * @param {string} code - The unit code as typed
 * @returns {string|undefined} The IRI, or undefined when nothing matches
 */
function lookupUnit (code) {
  if (code == null) return undefined;
  const trimmed = String(code).trim();
  const name = exact.get(trimmed);
  if (name) return `${OM2}/${name}`;
  return UNIT_IRI[trimmed.toLowerCase()] || UNIT_IRI[trimmed] || undefined;
}

module.exports = { lookupUnit };
