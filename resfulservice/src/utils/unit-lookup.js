'use strict';

const { OM2 } = require('../../config/constant');
const { units } = require('../../config/om2-units.json');
const {
  tieBreaks,
  aliases
} = require('../../config/om2-unit-overrides.json');

// Exact, case-sensitive keys: OM-2 symbols, then hand-kept entries over them.
const exact = new Map();
// Case-folded keys: every unit any exact key folding to it can mean.
const folded = new Map();
const addFolded = (key, name) => {
  const fold = key.toLowerCase();
  if (!folded.has(fold)) folded.set(fold, new Set());
  folded.get(fold).add(name);
};
Object.entries(units).forEach(([name, keys]) => {
  keys.forEach((key) => {
    exact.set(key, name);
    addFolded(key, name);
  });
});
[tieBreaks, aliases].forEach((table) => {
  Object.entries(table).forEach(([key, name]) => {
    exact.set(key, name);
    addFolded(key, name);
  });
});

/**
 * Resolve a unit code to an OM-2 unit IRI: the trimmed code's exact,
 * case-sensitive match first, else its case-folded match when that
 * names exactly one unit.
 * @param {string} code - The unit code as typed
 * @returns {string|undefined} The IRI, or undefined when nothing matches
 */
function lookupUnit (code) {
  if (code == null) return undefined;
  const trimmed = String(code).trim();
  let name = exact.get(trimmed);
  if (!name) {
    const owners = folded.get(trimmed.toLowerCase());
    if (owners && owners.size === 1) [name] = owners;
  }
  return name ? `${OM2}/${name}` : undefined;
}

module.exports = { lookupUnit };
