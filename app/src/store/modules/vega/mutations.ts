import { VegaState } from './types';

export default {
  setBaseSpec(state: VegaState, baseSpec: Record<string, any> | null): void {
    state.baseSpec = baseSpec;
  },
  setQuery(state: VegaState, query: string | null): void {
    state.query = query;
  },
  setTitle(state: VegaState, title: string | null): void {
    state.title = title;
  },
  setDescription(state: VegaState, description: string | null): void {
    state.description = description;
  },
  setDepiction(state: VegaState, depiction: string | null): void {
    state.depiction = depiction;
  },
  setDownloadUrl(state: VegaState, downloadUrl: string | null): void {
    state.downloadUrl = downloadUrl;
  },
  setDataset(state: VegaState, dataset: string | null): void {
    state.dataset = dataset;
  }
};
