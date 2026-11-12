/**
 * Pure store-mutation tests — no DOM needed, and the jsdom environment cannot
 * boot in the client image (canvas native binding is unbuilt there).
 *
 * @jest-environment node
 */
import { effectivePronyMax } from '@/composables/useDynamfitDefaults';
import mutations from '@/store/modules/explorer/mutations';
import { ExplorerState } from '@/store/modules/explorer/types';

const makeState = (overrides: Partial<ExplorerState> = {}): ExplorerState =>
  ({
    dynamfitData: { 'complex-chart': {} },
    dynamfitResetCount: 0,
    dynamfitFileMeta: { label: '', originalName: '' },
    ...overrides,
  } as ExplorerState);

describe('explorer mutations — dynamfit reset', () => {
  it('resetDynamfitData clears the charts', () => {
    const state = makeState();
    mutations.resetDynamfitData(state);
    expect(state.dynamfitData).toEqual({});
  });

  it('resetDynamfitData bumps dynamfitResetCount so in-flight fits go stale', () => {
    const state = makeState();
    mutations.resetDynamfitData(state);
    expect(state.dynamfitResetCount).toBe(1);
    mutations.resetDynamfitData(state);
    expect(state.dynamfitResetCount).toBe(2);
  });
});

describe('explorer mutations — dynamfit file metadata', () => {
  it('setDynamfitFileMeta stores the catalog label and the original filename', () => {
    const state = makeState();
    mutations.setDynamfitFileMeta(state, {
      label: 'Agilus30 (20°C)',
      originalName: 'agilus30-20C_mastercurve.tsv',
    });
    expect(state.dynamfitFileMeta).toEqual({
      label: 'Agilus30 (20°C)',
      originalName: 'agilus30-20C_mastercurve.tsv',
    });
  });

  it('setDynamfitFileMeta defaults missing fields to empty strings', () => {
    const state = makeState();
    mutations.setDynamfitFileMeta(state, {} as ExplorerState['dynamfitFileMeta']);
    expect(state.dynamfitFileMeta).toEqual({ label: '', originalName: '' });
  });

  it('resetDynamfit clears the file metadata along with the file name', () => {
    const state = makeState({
      dynamfitFileMeta: { label: 'PMMA (R10)', originalName: 'PMMA-R10_mastercurve.tsv' },
    });
    mutations.resetDynamfit(state);
    expect(state.dynamfitFileMeta).toEqual({ label: '', originalName: '' });
    expect(state.dynamfit.fileUpload).toBe('');
  });
});

describe('explorer mutations — dynamfit shift coefficients', () => {
  const fitted: ExplorerState['dynamfitShiftCoefficients'] = {
    C1: 22.7,
    C2: 190.2,
    Tg: 20,
    Ea: null,
    TC: null,
    a_T_ref: 1.0,
    chi2_reduced: 0.211,
    model: 'WLF',
  };

  it('setDynamfitShiftCoefficients stores every field, including the fitted model', () => {
    const state = makeState();
    mutations.setDynamfitShiftCoefficients(state, fitted);
    expect(state.dynamfitShiftCoefficients).toEqual(fitted);
  });

  it('resetDynamfitShiftCoefficients nulls every field, including the fitted model', () => {
    const state = makeState({ dynamfitShiftCoefficients: fitted });
    mutations.resetDynamfitShiftCoefficients(state);
    expect(state.dynamfitShiftCoefficients).toEqual({
      C1: null,
      C2: null,
      Tg: null,
      Ea: null,
      TC: null,
      a_T_ref: null,
      chi2_reduced: null,
      model: null,
    });
  });
});

describe('explorer mutations — grid size follows the term cap in a fit response', () => {
  const withRange = (range: number): ExplorerState =>
    makeState({
      dynamfit: { range, fitSettings: true, model: 'WLF', fileUpload: 'ramp.tsv' },
    });

  it('setDynamfitData drops a value above the cap to exactly the cap', () => {
    for (const range of [100, 58]) {
      const state = withRange(range);
      mutations.setDynamfitData(state, { max_prony: 23 });
      expect(state.dynamfit.range).toBe(23);
      // The slider's maximum and its value read the same number.
      expect(effectivePronyMax(23, state.dynamfit.range)).toBe(23);
      expect(state.dynamfit).toEqual({
        range: 23,
        fitSettings: true,
        model: 'WLF',
        fileUpload: 'ramp.tsv',
      });
    }
  });

  it('setDynamfitData leaves a value at or below the cap alone', () => {
    const above = withRange(58);
    mutations.setDynamfitData(above, { max_prony: 23 });
    expect(above.dynamfit.range).toBe(23);

    for (const range of [20, 23]) {
      const state = withRange(range);
      mutations.setDynamfitData(state, { max_prony: 23 });
      expect(state.dynamfit.range).toBe(range);
    }
  });

  it('setDynamfitData leaves the value alone when the response has no usable cap', () => {
    const capped = withRange(100);
    mutations.setDynamfitData(capped, { max_prony: 23 });
    expect(capped.dynamfit.range).toBe(23);

    // null on the temperature preview; absent from an empty response body; a
    // non-integer or a count below one term is no cap at all.
    const noCap = [
      { max_prony: null },
      {},
      { max_prony: 12.5 },
      { max_prony: 0 },
      { max_prony: -3 },
    ];
    for (const payload of noCap) {
      const state = withRange(100);
      mutations.setDynamfitData(state, payload);
      expect(state.dynamfit.range).toBe(100);
    }
    // A cap above the static maximum behaves as the maximum itself.
    const wide = withRange(100);
    mutations.setDynamfitData(wide, { max_prony: 250 });
    expect(wide.dynamfit.range).toBe(100);
  });
});
