/**
 * Pure store-mutation tests — no DOM needed, and the jsdom environment cannot
 * boot in the client image (canvas native binding is unbuilt there).
 *
 * @jest-environment node
 */
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
