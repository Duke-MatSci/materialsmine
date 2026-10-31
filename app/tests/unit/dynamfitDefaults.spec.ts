/**
 * Pure helper tests — no DOM needed, and the jsdom environment cannot boot in
 * the client image (canvas native binding is unbuilt there).
 *
 * @jest-environment node
 */
import {
  computeDefaultPronyTerms,
  fractionToPercent,
  percentToFraction,
  PERCENT_INPUT_STEP,
  PRONY_TERMS_PER_DECADE,
  RELATIVE_ERROR_DEFAULT_PERCENT,
  SMOOTHNESS_DEFAULT_PERCENT,
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

describe('percent conversion for the fit settings', () => {
  it('sends the defaults the fit was calibrated for', () => {
    expect(percentToFraction(SMOOTHNESS_DEFAULT_PERCENT)).toBe(0.04);
    expect(percentToFraction(RELATIVE_ERROR_DEFAULT_PERCENT)).toBe(0.01);
  });

  it('keeps a step off the default free of binary noise', () => {
    // 4.1 / 100 is 0.041000000000000004 unrounded, which then shows up in the
    // request payload and in anything that stringifies it.
    expect(percentToFraction(SMOOTHNESS_DEFAULT_PERCENT + PERCENT_INPUT_STEP)).toBe(0.041);
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
