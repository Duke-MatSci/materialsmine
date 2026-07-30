/**
 * Defaults derived from the uploaded data itself.
 *
 * The Prony series needs roughly a fixed number of terms per decade of the
 * independent variable; a flat default of 100 badly over-parameterises a
 * narrow master curve and quietly overfits the noise.
 */

// Terms per decade of frequency span.
export const PRONY_TERMS_PER_DECADE = 3;

// The server rejects anything outside 1..100, and a handful of terms is the
// floor below which the fit stops being meaningful.
export const PRONY_TERMS_MIN = 5;
export const PRONY_TERMS_MAX = 100;

/**
 * Estimate a sensible number of Prony terms from the decade span of the first
 * column of a data file.
 *
 * Column separators may be whitespace, comma or semicolon; a header row is
 * skipped implicitly because `parseFloat` yields NaN for it. Returns null when
 * the file has too few usable rows to say anything, in which case the caller
 * should leave the existing default alone.
 */
export function computeDefaultPronyTerms(
  fileText: string,
  k: number = PRONY_TERMS_PER_DECADE
): number | null {
  const values: number[] = [];
  for (const line of fileText.split(/\r?\n/)) {
    const v = parseFloat(line.trim().split(/[\s,;]+/)[0]);
    if (Number.isFinite(v) && v > 0) values.push(v);
  }
  if (values.length < 2) return null;

  const decades = Math.log10(Math.max(...values) / Math.min(...values));
  if (!Number.isFinite(decades) || decades <= 0) return null;

  return Math.min(PRONY_TERMS_MAX, Math.max(PRONY_TERMS_MIN, Math.round(k * decades)));
}
