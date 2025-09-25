import { MutationTree } from 'vuex';
import { ResultsState } from './index';

const mutations: MutationTree<ResultsState> = {
  // TODO:
  setArticles(state: ResultsState, articles: any[]) {
    state.articles = articles;
  },
  setSamples(state: ResultsState, samples: any[]) {
    state.samples = samples;
  },
  setImages(state: ResultsState, images: any[]) {
    state.images = images;
  },
  setCharts(state: ResultsState, charts: any[]) {
    state.charts = charts;
  },
  setMaterials(state: ResultsState, materials: any[]) {
    state.materials = materials;
  },
  setTotal(state: ResultsState, payload: number) {
    state.total = payload;
  },
  setAutosuggest(state: ResultsState, payload: string[]) {
    state.suggestions = payload;
  },
  setIsLoading(state: ResultsState, payload: boolean) {
    state.isLoading = payload;
  },
  setTotalGrouping(state: ResultsState, payload: ResultsState['totalGrouping']) {
    state.totalGrouping = payload;
  },
};

export default mutations;
