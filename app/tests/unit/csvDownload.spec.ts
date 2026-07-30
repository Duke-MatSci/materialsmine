/**
 * Pure helper tests — no DOM needed, and the jsdom environment cannot boot in
 * the client image (canvas native binding is unbuilt there).
 *
 * @jest-environment node
 */
import { toCsv } from '@/composables/useCsvDownload';

describe('toCsv', () => {
  it('writes a header row and one row per record', () => {
    expect(toCsv([{ i: 1, tau: 0.5 }, { i: 2, tau: 5 }])).toBe('i,tau\r\n1,0.5\r\n2,5');
  });

  it('takes the header from the union of keys, so a ragged table keeps them all', () => {
    expect(toCsv([{ a: 1 }, { b: 2 }])).toBe('a,b\r\n1,\r\n,2');
  });

  it('writes an empty cell for null and undefined rather than the words', () => {
    expect(toCsv([{ a: null, b: undefined, c: 0 }])).toBe('a,b,c\r\n,,0');
  });

  it('quotes only the fields that would otherwise break the row', () => {
    const csv = toCsv([{ plain: 'no quotes', comma: 'a,b', quote: 'say "hi"', nl: 'a\nb' }]);
    expect(csv.split('\r\n')[1]).toBe('no quotes,"a,b","say ""hi""","a\nb"');
  });

  it('returns empty for no rows, which is the caller’s signal not to download', () => {
    expect(toCsv([])).toBe('');
    expect(toCsv([{}])).toBe('');
  });
});
