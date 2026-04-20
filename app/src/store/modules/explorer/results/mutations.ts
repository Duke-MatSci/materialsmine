import { ResultsState } from './types';

export default {
  // TODO:
  setArticles(state: ResultsState, articles: any[]): void {
    state.articles = articles;
  },
  setSamples(state: ResultsState, samples: any[]): void {
    state.samples = samples;
  },
  setImages(state: ResultsState, images: any[]): void {
    state.images = images;
  },
  setCharts(state: ResultsState, charts: any[]): void {
    state.charts = charts;
  },
  setMaterials(state: ResultsState, materials: any[]): void {
    state.materials = materials;
  },
  setTotal(state: ResultsState, payload: number): void {
    state.total = payload;
  },
  setAutosuggest(state: ResultsState, payload: any[]): void {
    state.suggestions = payload;
  },
  setIsLoading(state: ResultsState, payload: boolean): void {
    state.isLoading = payload;
  },
  setTotalGrouping(state: ResultsState, payload: ResultsState['totalGrouping']): void {
    state.totalGrouping = payload;
  }
};
