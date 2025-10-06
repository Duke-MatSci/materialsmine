import { GalleryState, GalleryItem, FavoriteChartItem } from '../types';

export default {
  setAllItems(state: GalleryState, allItems: GalleryItem[] | null): void {
    state.items = allItems;
  },
  setItems(state: GalleryState, items: GalleryItem[] | null): void {
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
  setfavoriteChartItems(state: GalleryState, items: FavoriteChartItem[]): void {
    state.favoriteChartItems = items;
  },
  setMissingCharts(state: GalleryState, payload: unknown[]): void {
    state.missingCharts = payload;
  },
  setTotalFavorites(state: GalleryState, totalFavorites: number): void {
    state.totalFavorites = totalFavorites;
  },
};
