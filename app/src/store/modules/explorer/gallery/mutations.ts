import { MutationTree } from 'vuex';
import { GalleryState } from './index';

const mutations: MutationTree<GalleryState> = {
  setAllItems(state: GalleryState, allItems: any[]) {
    // state.allItems = allItems;
  },
  setItems(state: GalleryState, items: any[]) {
    state.items = items;
  },
  setPage(state: GalleryState, page: number) {
    state.page = page;
  },
  setTotal(state: GalleryState, total: number) {
    state.total = total;
  },
  setQueryTimeMillis(state: GalleryState, queryTimeMillis: number) {
    state.queryTimeMillis = queryTimeMillis;
  },
  setfavoriteChartItems(state: GalleryState, items: any[]) {
    state.favoriteChartItems = items;
  },
  setMissingCharts(state: GalleryState, payload: any[]) {
    state.missingCharts = payload;
  },
  setTotalFavorites(state: GalleryState, totalFavorites: number) {
    state.totalFavorites = totalFavorites;
  },
};

export default mutations;
