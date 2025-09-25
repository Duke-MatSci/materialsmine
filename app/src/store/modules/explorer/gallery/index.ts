import mutations from './mutations';
import actions from './actions';
import getters from './getters';

export interface GalleryState {
  // allItems: any[] | null;
  items: any[] | null;
  pageSize: number;
  page: number;
  queryTimeMillis: number;
  total: number;
  totalFavorites: number;
  missingCharts: any[];
  favoriteChartItems: any[];
}

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
      favoriteChartItems: [],
    };
  },
  mutations,
  actions,
  getters,
};
