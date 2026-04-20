import mutations from './mutations';
import actions from './actions';
import getters from './getters';
import { VegaState } from './types';
import { getDefaultChart } from '@/modules/vega-chart';

export default {
  namespaced: true,
  state(): VegaState {
    return {
      ...getDefaultChart()
    };
  },
  mutations,
  actions,
  getters
};
