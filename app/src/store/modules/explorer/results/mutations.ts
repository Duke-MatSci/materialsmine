import {
  ResultsState,
  Article,
  Sample,
  ImageResult,
  Chart,
  Material,
  TotalGrouping,
} from '../types';

export default {
  setArticles(state: ResultsState, articles: Article[]): void {
    state.articles = articles;
  },
  setSamples(state: ResultsState, samples: Sample[]): void {
    state.samples = samples;
  },
  setImages(state: ResultsState, images: ImageResult[]): void {
    state.images = images;
  },
  setCharts(state: ResultsState, charts: Chart[]): void {
    state.charts = charts;
  },
  setMaterials(state: ResultsState, materials: Material[]): void {
    state.materials = materials;
  },
  setTotal(state: ResultsState, payload: number): void {
    state.total = payload;
  },
  setAutosuggest(state: ResultsState, payload: string[]): void {
    state.suggestions = payload;
  },
  setIsLoading(state: ResultsState, payload: boolean): void {
    state.isLoading = payload;
  },
  setTotalGrouping(state: ResultsState, payload: TotalGrouping): void {
    state.totalGrouping = payload;
  },
};
