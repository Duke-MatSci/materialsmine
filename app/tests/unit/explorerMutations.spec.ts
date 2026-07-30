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
