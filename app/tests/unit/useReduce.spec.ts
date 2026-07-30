/**
 * Pure composable tests — no DOM needed, and the jsdom environment cannot boot
 * in the client image (canvas native binding is unbuilt there).
 *
 * @jest-environment node
 */
import { useReduce } from '@/composables/useReduce';

const { reduceDescription } = useReduce();

describe('reduceDescription — startFromEnd', () => {
  it('returns the unspaced tail of a mangled upload name', () => {
    const name = 'harsh_primate_anica-2025-11-12T07:28:19.449Z-tidy.csv';
    expect(reduceDescription(name, 25, true)).toBe('...12T07:28:19.449Z-tidy.csv');
  });

  it('does not insert spaces between characters', () => {
    expect(reduceDescription('abcdef', 3, true)).toBe('...def');
  });

  it('omits the ellipsis when nothing was truncated', () => {
    expect(reduceDescription('abc', 10, true)).toBe('abc');
    expect(reduceDescription('abc', 3, true)).toBe('abc');
  });

  it('returns an empty string for empty input', () => {
    expect(reduceDescription('', 10, true)).toBe('');
  });
});

describe('reduceDescription — forward word path', () => {
  it('leaves short text untouched', () => {
    expect(reduceDescription('one two three', 5)).toBe('one two three');
  });

  it('truncates on word boundaries and appends an ellipsis', () => {
    expect(reduceDescription('one two three four', 2)).toBe('one two...');
  });
});
