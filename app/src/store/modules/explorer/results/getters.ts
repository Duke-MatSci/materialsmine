import { ResultsState } from './types';

export default {
  // TODO:
  getArticles(state: ResultsState): any[] | null {
    return state.articles;
  },
  getSamples(state: ResultsState): any[] | null {
    return state.samples;
  },
  getImages(state: ResultsState): any[] | null {
    return state.images;
  },
  getCharts(state: ResultsState): any[] | null {
    return state.charts;
  },
  getMaterials(state: ResultsState): any[] | null {
    return state.materials;
  },
  getSuggestions(state: ResultsState): any[] {
    return state.suggestions;
  },
  getTotal(state: ResultsState): number {
    return state.total;
  },
  getIsloading(state: ResultsState): boolean {
    return state.isLoading;
  },
  getTotalGroupings(state: ResultsState): ResultsState['totalGrouping'] {
    return state.totalGrouping;
  }
};
