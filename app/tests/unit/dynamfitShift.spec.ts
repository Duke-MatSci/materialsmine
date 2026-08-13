/**
 * Pure helper tests — no DOM needed, and the jsdom environment cannot boot in
 * the client image (canvas native binding is unbuilt there).
 *
 * @jest-environment node
 */
import {
  resolveShiftFitModel,
  buildShiftCoefficientRows,
  ShiftCoefficients,
} from '@/composables/useDynamfitShift';

describe('resolveShiftFitModel', () => {
  it('passes WLF through when its Tg anchor is present', () => {
    expect(resolveShiftFitModel('WLF', 20, null)).toBe('WLF');
  });

  it('passes hybrid through when its TL anchor is present', () => {
    expect(resolveShiftFitModel('hybrid', null, 80)).toBe('hybrid');
  });

  it('returns null for WLF/hybrid without their anchor', () => {
    expect(resolveShiftFitModel('WLF', null, 80)).toBeNull();
    expect(resolveShiftFitModel('hybrid', 20, null)).toBeNull();
  });

  it('maps manual to WLF when Tg is set, hybrid when only TL is set', () => {
    // /fit-shift rejects 'manual' with a 400, so manual mode must borrow a
    // real model — the old code sent 'manual' and every fit died on it.
    expect(resolveShiftFitModel('manual', 20, null)).toBe('WLF');
    expect(resolveShiftFitModel('manual', null, 80)).toBe('hybrid');
  });

  it('prefers WLF when manual mode has both anchors', () => {
    expect(resolveShiftFitModel('manual', 20, 80)).toBe('WLF');
  });

  it('returns null for manual with no anchors, and for none/empty', () => {
    expect(resolveShiftFitModel('manual', null, null)).toBeNull();
    expect(resolveShiftFitModel('none', 20, 80)).toBeNull();
    expect(resolveShiftFitModel('', 20, 80)).toBeNull();
  });

  it('treats empty-string inputs as absent anchors', () => {
    expect(resolveShiftFitModel('WLF', '', null)).toBeNull();
    expect(resolveShiftFitModel('manual', '', '')).toBeNull();
  });

  it('accepts a zero-degree anchor (Tg = 0 °C is a valid reference)', () => {
    expect(resolveShiftFitModel('WLF', 0, null)).toBe('WLF');
  });
});

describe('buildShiftCoefficientRows', () => {
  const fitted: ShiftCoefficients = {
    C1: 22.7,
    C2: 190.2,
    Tg: 20,
    Ea: null,
    TL: null,
    // WLF co-fits this offset too, so a fitted WLF result is not pinned at 1.
    a_T_ref: 2.17,
    chi2_reduced: 0.211,
  };

  it('emits a parameter/value row for the method and each non-null value', () => {
    expect(buildShiftCoefficientRows('WLF', fitted)).toEqual([
      { parameter: 'transform_method', value: 'WLF' },
      { parameter: 'Tg', value: 20 },
      { parameter: 'C1', value: 22.7 },
      { parameter: 'C2', value: 190.2 },
      { parameter: 'a_T_ref', value: 2.17 },
      { parameter: 'chi2_reduced', value: 0.211 },
    ]);
  });

  it('skips null values so a WLF export has no blank Ea/TL rows', () => {
    const rows = buildShiftCoefficientRows('WLF', fitted);
    expect(rows.map((r) => r.parameter)).not.toContain('Ea');
    expect(rows.map((r) => r.parameter)).not.toContain('TL');
  });

  it('returns only the method row when nothing has been fitted', () => {
    const empty: ShiftCoefficients = {
      C1: null,
      C2: null,
      Tg: null,
      Ea: null,
      TL: null,
      a_T_ref: null,
      chi2_reduced: null,
    };
    expect(buildShiftCoefficientRows('none', empty)).toEqual([
      { parameter: 'transform_method', value: 'none' },
    ]);
  });
});
