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
 * Relative error is entered as a percentage and sent as a fraction. It was
 * measured against the six bundled master curves at PRONY_TERMS_PER_DECADE
 * terms per decade.
 *
 * 1% relative error is the geometric mean of the per-file values that put the
 * unsmoothed fit at chi-squared/dof = 1. The old 20% default sat three decades
 * below that, so the readout was uninterpretable. No single number suits every
 * file — the per-file ideals span 0.11% to 4.2% — but a file supplying its own
 * error columns ignores this entirely.
 */
export const RELATIVE_ERROR_DEFAULT_PERCENT = 1;

// Step of the relative-error input, in percent. A tenth of a percent resolves
// the useful range of the knob without making the stepper useless.
export const PERCENT_INPUT_STEP = 0.1;

/**
 * Smoothness is the raw knob s, entered and sent as a plain number; 0
 * disables the curvature penalty. The default was measured on the seven
 * bundled master curves (Cavaille PS, PETMP, PMMA-R09, VeroCyan, agilus30,
 * dgeba, fisher polycarbonate) at the 1% relative-error default, with
 * PRONY_TERMS_PER_DECADE terms per decade and a solid fit. The posterior loss
 * of a file at s is its surprisal -log pi(s^2) minus that file's minimum.
 *
 * s = 0.3 sits within 0.06 nats of the minimum total loss (minimizer 0.313;
 * the worst-case minimizer is 0.332), while the per-file optima run 0.079 to
 * 1.78. The knob is not a percentage because, with the error set so the
 * unsmoothed fit reaches chi-squared/dof = 1, the per-file optima cluster near
 * s = 1 (0.46 to 2.0; minimizers about 0.9 to 0.95), the mean of the
 * unit-rate exponential prior on s^2, so "100%" would misleadingly read as
 * complete smoothing.
 */
export const SMOOTHNESS_DEFAULT = 0.3;
export const SMOOTHNESS_MIN = 0;
export const SMOOTHNESS_MAX = 10;
export const SMOOTHNESS_STEP = 0.1;

/**
 * When the upload supplies its own error column(s), the error widget switches
 * from "Relative Error (%)" to "Error Scale": a unitless multiplier on the
 * file's sigmas. 1.0 means "use the columns exactly as supplied", which is why
 * it is the default — the first fit after an upload must respect the file
 * before the client even knows the columns exist.
 */
export const ERROR_SCALE_DEFAULT = 1.0;
export const ERROR_SCALE_STEP = 0.1;

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

/**
 * Maximum for the grid-size slider: the server's term cap for the extracted
 * data, limited to PRONY_TERMS_MAX. The cap never falls below the current
 * value, because a range input whose max drops under its value clamps the
 * thumb without firing input and leaves v-model out of step with the store.
 */
export function effectivePronyMax(
  serverMax: number | null | undefined,
  currentValue: number
): number {
  if (typeof serverMax !== 'number' || !Number.isInteger(serverMax) || serverMax < 1) {
    return PRONY_TERMS_MAX;
  }
  const cap = Math.min(PRONY_TERMS_MAX, serverMax);
  return Number.isFinite(currentValue) ? Math.max(cap, currentValue) : cap;
}

/** Tooltip position, in percent, of a value on a 1..max range track. */
export function pronyTooltipLeft(value: number, max: number): number {
  if (max <= 1) return 0;
  const left = ((value - 1) / (max - 1)) * 100;
  return Math.min(100, Math.max(0, left));
}
