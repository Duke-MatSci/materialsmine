export interface ResultsState {
  articles: any[] | null;
  samples: any[] | null;
  images: any[] | null;
  charts: any[] | null;
  materials: any[] | null;
  suggestions: any[];
  total: number;
  isLoading: boolean;
  totalGrouping: {
    getArticles: number;
    getSamples: number;
    getImages: number;
    getCharts: number;
    getMaterials: number;
  };
}
