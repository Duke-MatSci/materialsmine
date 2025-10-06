import { SddDatasetsState, DatasetItem } from '../types';

export default {
  setDatasetList(state: SddDatasetsState, payload: DatasetItem[]): void {
    state.items = payload;
  },
  setDatasetTotal(state: SddDatasetsState, payload: number): void {
    state.total = payload;
  },
  setDatasetPage(state: SddDatasetsState, payload: number): void {
    state.page = payload;
  },
  setQueryTimeMillis(state: SddDatasetsState, queryTimeMillis: number): void {
    state.queryTimeMillis = queryTimeMillis;
  },
};
