import { GetterTree } from 'vuex';
import { ResultsState } from './index';

const getters: GetterTree<ResultsState, any> = {
  // TODO:
  getArticles(state: ResultsState) {
    return state.articles;
  },
  getSamples(state: ResultsState) {
    return state.samples;
  },
  getImages(state: ResultsState) {
    return state.images;
  },
  getCharts(state: ResultsState) {
    return state.charts;
  },
  getMaterials(state: ResultsState) {
    return state.materials;
  },
  getSuggestions(state: ResultsState) {
    return state.suggestions;
  },
  getTotal(state: ResultsState) {
    return state.total;
  },
  getIsloading(state: ResultsState) {
    return state.isLoading;
  },
  getTotalGroupings(state: ResultsState) {
    return state.totalGrouping;
  },
};

export default getters;
