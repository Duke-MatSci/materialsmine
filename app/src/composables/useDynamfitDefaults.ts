/**
 * Defaults for the Tri-VE fit settings, some fixed and some derived from the
 * uploaded data itself.
 *
 * The Prony series needs roughly a fixed number of terms per decade of the
 * independent variable; a flat default of 100 badly over-parameterises a
 * narrow master curve and quietly overfits the noise.
 */

// Terms per decade of frequency span.
export const PRONY_TERMS_PER_DECADE = 3;

/**
 * Smoothness and relative error are entered as percentages and sent as
 * fractions. Both were measured against the six bundled master curves at
 * PRONY_TERMS_PER_DECADE terms per decade.
 *
 * 1% relative error is the geometric mean of the per-file values that put the
 * unsmoothed fit at chi-squared/dof = 1. The old 20% default sat three decades
 * below that, so the readout was uninterpretable. No single number suits every
 * file — the per-file ideals span 0.11% to 4.2% — but a file supplying its own
 * error columns ignores this entirely.
 *
 * 4% smoothness then minimises both the worst-case and the total posterior
 * loss across those files, whose individual optima run 2.2% to 16%. That
 * spread is only 7x once the error scale is right; at the old 20% error it was
 * 48x, because the posterior trades misfit against roughness using the sigma
 * it is given.
 */
export const SMOOTHNESS_DEFAULT_PERCENT = 4;
export const RELATIVE_ERROR_DEFAULT_PERCENT = 1;

// Step of both inputs, in percent. A tenth of a percent resolves the useful
// range of either knob without making the steppers useless.
export const PERCENT_INPUT_STEP = 0.1;

/** Convert a percentage from the settings inputs into the fraction the API wants. */
export function percentToFraction(percent: number): number {
  if (!Number.isFinite(percent)) return percent;
  // Round at the step's resolution so 4.1% does not travel as 0.041000000000000004.
  return Math.round(percent * 1000) / 100000;
}

/** Convert an API fraction back into the percentage shown in the inputs. */
export function fractionToPercent(fraction: number): number {
  if (!Number.isFinite(fraction)) return fraction;
  return Math.round(fraction * 100000) / 1000;
}

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
