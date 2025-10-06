import mutations from './mutations';
import actions from './actions';
import getters from './getters';
import { SddDatasetsState } from '../types';

export default {
  namespaced: true,
  state(): SddDatasetsState {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      queryTimeMillis: 0,
    };
  },
  mutations,
  actions,
  getters,
};
