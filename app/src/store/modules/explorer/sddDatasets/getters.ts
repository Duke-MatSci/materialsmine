import { SddDatasetsState, DatasetItem } from '../types';

export default {
  getAllDatasets(state: SddDatasetsState): DatasetItem[] {
    return state.items;
  },
  getTotal(state: SddDatasetsState): number {
    return state.total || 0;
  },
  getTotalPages(state: SddDatasetsState, getters: Record<string, unknown>): number {
    return Math.ceil(
      (getters.getTotal as number) / (getters.getPageSize as number)
    );
  },
  getPage(state: SddDatasetsState): number {
    return state.page;
  },
  getPageSize(state: SddDatasetsState): number {
    return state.pageSize;
  },
  getQueryTimeMillis(state: SddDatasetsState): number {
    return state.queryTimeMillis;
  },
};
