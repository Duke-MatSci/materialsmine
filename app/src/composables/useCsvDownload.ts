/**
 * Client-side CSV export.
 *
 * The obvious dependency for this, vue-json-csv, is a Vue 2 component: its
 * compiled render calls Vue 2's `_c` helper, which does not exist under Vue 3,
 * so rendering it anywhere throws "Cannot read properties of undefined
 * (reading '_c')". Registering it is what turns a silently inert tag into a
 * crash, which is why the rest of the app appears to get away with importing
 * it. Exporting a few flat rows needs no dependency at all.
 */

type Row = Record<string, unknown>;

/** Quote a field only when it would otherwise break the row, per RFC 4180. */
const cell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /["\n\r,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * Render rows as CSV, with the header taken from the union of their keys so a
 * ragged table still exports every column. Returns '' for no rows.
 */
export function toCsv(rows: Row[]): string {
  if (!rows.length) return '';
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (!columns.length) return '';
  const body = rows.map((row) => columns.map((c) => cell(row[c])).join(','));
  return [columns.map(cell).join(','), ...body].join('\r\n');
}

/**
 * Offer `rows` to the user as a CSV download. Returns false without touching
 * the DOM when there is nothing to write, so callers never hand over a blank
 * file.
 */
export function downloadCsv(rows: Row[], filename: string): boolean {
  const csv = toCsv(rows);
  if (!csv) return false;

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
