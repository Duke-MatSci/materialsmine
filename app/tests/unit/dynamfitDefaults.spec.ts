/**
 * Pure helper tests — no DOM needed, and the jsdom environment cannot boot in
 * the client image (canvas native binding is unbuilt there).
 *
 * @jest-environment node
 */
import * as defaults from '@/composables/useDynamfitDefaults';
import {
  computeDefaultPronyTerms,
  fractionToPercent,
  percentToFraction,
  PERCENT_INPUT_STEP,
  PRONY_TERMS_PER_DECADE,
  RELATIVE_ERROR_DEFAULT_PERCENT,
  SMOOTHNESS_DEFAULT,
  SMOOTHNESS_MAX,
  SMOOTHNESS_MIN,
  SMOOTHNESS_STEP,
} from '@/composables/useDynamfitDefaults';

// Rows spanning `decades` decades of frequency, three columns, tab separated.
const rowsSpanning = (decades: number, points = 12, sep = '\t'): string[] => {
  const rows: string[] = [];
  for (let i = 0; i < points; i++) {
    const f = Math.pow(10, (decades * i) / (points - 1));
    rows.push([f, 1e9, 1e7].join(sep));
  }
  return rows;
};

describe('computeDefaultPronyTerms', () => {
  it('uses about three terms per decade of span', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(7).join('\n'))).toBe(21);
    expect(PRONY_TERMS_PER_DECADE).toBe(3);
  });

  it('honours a caller-supplied terms-per-decade', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(4).join('\n'), 5)).toBe(20);
  });

  it('clamps a narrow span up to the minimum', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(0.5).join('\n'))).toBe(5);
  });

  it('clamps a very wide span down to the server maximum', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(60).join('\n'))).toBe(100);
  });

  it('ignores a header row', () => {
    const withHeader = ['Frequency\tE_storage\tE_loss', ...rowsSpanning(7)].join('\n');
    expect(computeDefaultPronyTerms(withHeader)).toBe(21);
  });

  it('tolerates CRLF line endings and trailing blank lines', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(7).join('\r\n') + '\r\n\r\n')).toBe(21);
  });

  it('tolerates comma and semicolon separators', () => {
    expect(computeDefaultPronyTerms(rowsSpanning(7, 12, ',').join('\n'))).toBe(21);
    expect(computeDefaultPronyTerms(rowsSpanning(7, 12, ';').join('\n'))).toBe(21);
  });

  it('returns null when there are fewer than two usable rows', () => {
    expect(computeDefaultPronyTerms('')).toBeNull();
    expect(computeDefaultPronyTerms('Frequency\tE_storage\tE_loss')).toBeNull();
    expect(computeDefaultPronyTerms('Frequency\tE\n1\t1e9')).toBeNull();
  });

  it('returns null when every row shares one value, so the span is zero', () => {
    expect(computeDefaultPronyTerms('1\t1e9\n1\t1e9\n1\t1e9')).toBeNull();
  });

  it('skips non-positive values that log10 cannot use', () => {
    expect(computeDefaultPronyTerms('0\t1e9\n-1\t1e9\n1\t1e9')).toBeNull();
  });
});

describe('smoothness setting', () => {
  it('defaults to the raw knob value the bundled curves were calibrated for', () => {
    // 0.3 sits within 0.06 nats of the total surprisal minimum (s = 0.313)
    // over the seven bundled master curves at 1% relative error.
    expect(SMOOTHNESS_DEFAULT).toBe(0.3);
  });

  it('is entered as the raw knob, with no percent default left to convert', () => {
    // The API has always taken the raw value; a percent constant would invite
    // the consumer to keep sending percentToFraction of it.
    expect('SMOOTHNESS_DEFAULT_PERCENT' in defaults).toBe(false);
  });

  it('offers 0 to 10 in steps of 0.1', () => {
    expect(SMOOTHNESS_MIN).toBe(0);
    expect(SMOOTHNESS_MAX).toBe(10);
    expect(SMOOTHNESS_STEP).toBe(0.1);
  });

  it('puts the default on the step grid and within bounds', () => {
    const steps = (SMOOTHNESS_DEFAULT - SMOOTHNESS_MIN) / SMOOTHNESS_STEP;
    expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-9);
    expect(SMOOTHNESS_DEFAULT).toBeGreaterThanOrEqual(SMOOTHNESS_MIN);
    expect(SMOOTHNESS_DEFAULT).toBeLessThanOrEqual(SMOOTHNESS_MAX);
  });
});

describe('percent conversion for the fit settings', () => {
  it('sends the relative error default the fit was calibrated for', () => {
    expect(percentToFraction(RELATIVE_ERROR_DEFAULT_PERCENT)).toBe(0.01);
  });

  it('keeps a stepped percentage free of binary noise', () => {
    // 4.1 / 100 is 0.041000000000000004 unrounded, which then shows up in the
    // request payload and in anything that stringifies it.
    expect(percentToFraction(4 + PERCENT_INPUT_STEP)).toBe(0.041);
    expect(percentToFraction(0.3)).toBe(0.003);
  });

  it('round-trips every value the steppers can reach', () => {
    for (let percent = 0; percent <= 200; percent += PERCENT_INPUT_STEP) {
      const p = Math.round(percent * 10) / 10;
      expect(fractionToPercent(percentToFraction(p))).toBe(p);
    }
  });

  it('passes a cleared input straight through instead of reading it as zero', () => {
    // v-model.number hands back '' for an empty field; turning that into 0
    // would silently claim the data is exact.
    expect(percentToFraction(NaN)).toBeNaN();
    expect(percentToFraction('' as unknown as number)).toBe('');
    expect(fractionToPercent('' as unknown as number)).toBe('');
  });
});
