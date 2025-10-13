import { SddDatasetsState } from './types';

export default {
  getAllDatasets(state: SddDatasetsState): any[] {
    return state.items;
  },
  getTotal(state: SddDatasetsState): number {
    return state.total || 0;
  },
  getTotalPages(_state: SddDatasetsState, getters: any): number {
    return Math.ceil(getters.getTotal / getters.getPageSize);
  },
  getPage(state: SddDatasetsState): number {
    return state.page;
  },
  getPageSize(state: SddDatasetsState): number {
    return state.pageSize;
  },
  getQueryTimeMillis(state: SddDatasetsState): number {
    return state.queryTimeMillis;
  }
};
