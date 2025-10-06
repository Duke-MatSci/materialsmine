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
  getArticles(state: ResultsState): Article[] | null {
    return state.articles;
  },
  getSamples(state: ResultsState): Sample[] | null {
    return state.samples;
  },
  getImages(state: ResultsState): ImageResult[] | null {
    return state.images;
  },
  getCharts(state: ResultsState): Chart[] | null {
    return state.charts;
  },
  getMaterials(state: ResultsState): Material[] | null {
    return state.materials;
  },
  getSuggestions(state: ResultsState): string[] {
    return state.suggestions;
  },
  getTotal(state: ResultsState): number {
    return state.total;
  },
  getIsloading(state: ResultsState): boolean {
    return state.isLoading;
  },
  getTotalGroupings(state: ResultsState): TotalGrouping {
    return state.totalGrouping;
  },
};
