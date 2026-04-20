import { GalleryState } from './types';

export default {
  setAllItems(state: GalleryState, allItems: any[]): void {
    (state as any).allItems = allItems;
  },
  setItems(state: GalleryState, items: any[]): void {
    state.items = items;
  },
  setPage(state: GalleryState, page: number): void {
    state.page = page;
  },
  setTotal(state: GalleryState, total: number): void {
    state.total = total;
  },
  setQueryTimeMillis(state: GalleryState, queryTimeMillis: number): void {
    state.queryTimeMillis = queryTimeMillis;
  },
  setfavoriteChartItems(state: GalleryState, items: any[]): void {
    state.favoriteChartItems = items;
  },
  setMissingCharts(state: GalleryState, payload: any[]): void {
    state.missingCharts = payload;
  },
  setTotalFavorites(state: GalleryState, totalFavorites: number): void {
    state.totalFavorites = totalFavorites;
  }
};
