import mutations from './mutations';
import actions from './actions';
import getters from './getters';

interface MetamineNUState {
  fetchedNames: any[];
  datasets: any[];
  activeData: any[];
  dataLibrary: any[];
  dataPoint: any;
  selectedData: any[];
  page: string;
  query1: string | null;
  query2: string | null;
  neighbors: any[];
  reset: boolean;
  knnUmap: number;
  dialogBoxActiveKnn: boolean;
  enableKnn: boolean;
  refreshStatus: boolean;
  loadingState: boolean;
  rawJson: any;
}

export default {
  namespaced: true,
  state(): MetamineNUState {
    return {
      fetchedNames: [],
      datasets: [],
      activeData: [],
      dataLibrary: [],
      dataPoint: {},
      selectedData: [],
      page: 'pairwise',
      query1: null,
      query2: null,
      neighbors: [],
      reset: false,
      knnUmap: 15,
      dialogBoxActiveKnn: false,
      enableKnn: true,
      refreshStatus: true,
      loadingState: true,
      rawJson: null,
    };
  },
  mutations,
  actions,
  getters,
};
