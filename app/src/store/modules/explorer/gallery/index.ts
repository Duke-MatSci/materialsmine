import mutations from './mutations';
import actions from './actions';
import getters from './getters';
import { GalleryState } from './types';

export default {
  namespaced: true,
  state(): GalleryState {
    return {
      // allItems: null,
      items: null,
      pageSize: 50,
      page: 1,
      queryTimeMillis: 0,
      total: 0,
      totalFavorites: 0,
      missingCharts: [],
      favoriteChartItems: []
    };
  },
  mutations,
  actions,
  getters
};
