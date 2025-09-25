import { GetterTree } from 'vuex';
import { GalleryState } from './index';

const getters: GetterTree<GalleryState, any> = {
  allItems(state: GalleryState) {
    // return state.allItems;
    return null;
  },
  items(state: GalleryState) {
    return state.items;
  },
  pageSize(state: GalleryState) {
    return state.pageSize;
  },
  page(state: GalleryState) {
    return state.page;
  },
  total(state: GalleryState) {
    return state.total || 0;
  },
  totalPages(state: GalleryState, getters: any) {
    return Math.ceil(getters.total / getters.pageSize);
  },
  queryTimeMillis(state: GalleryState) {
    return state.queryTimeMillis;
  },
  favoriteChartItems(state: GalleryState) {
    return state.favoriteChartItems;
  },
  totalFavorites(state: GalleryState) {
    return state.totalFavorites || 0;
  },
  missingCharts(state: GalleryState) {
    return state.missingCharts;
  },
};

export default getters;
