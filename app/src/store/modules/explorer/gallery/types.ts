export interface GalleryState {
  items: any[] | null;
  pageSize: number;
  page: number;
  queryTimeMillis: number;
  total: number;
  totalFavorites: number;
  missingCharts: any[];
  favoriteChartItems: any[];
}
