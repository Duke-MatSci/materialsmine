/**
 * Pure helper tests — no DOM needed, and the jsdom environment cannot boot in
 * the client image (canvas native binding is unbuilt there).
 *
 * @jest-environment node
 */
import {
  computeDefaultPronyTerms,
  PRONY_TERMS_PER_DECADE,
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
