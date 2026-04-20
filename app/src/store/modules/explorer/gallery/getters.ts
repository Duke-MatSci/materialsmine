import { GalleryState } from './types';

export default {
  allItems(state: GalleryState): any[] | null {
    return (state as any).allItems;
  },
  items(state: GalleryState): any[] | null {
    return state.items;
  },
  pageSize(state: GalleryState): number {
    return state.pageSize;
  },
  page(state: GalleryState): number {
    return state.page;
  },
  total(state: GalleryState): number {
    return state.total || 0;
  },
  totalPages(_state: GalleryState, getters: any): number {
    return Math.ceil(getters.total / getters.pageSize);
  },
  queryTimeMillis(state: GalleryState): number {
    return state.queryTimeMillis;
  },
  favoriteChartItems(state: GalleryState): any[] {
    return state.favoriteChartItems;
  },
  totalFavorites(state: GalleryState): number {
    return state.totalFavorites || 0;
  },
  missingCharts(state: GalleryState): any[] {
    return state.missingCharts;
  }
};
