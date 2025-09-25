import mutations from './mutations';
import actions from './actions';
import getters from './getters';

export interface ResultsState {
  // TODO:
  articles: any[] | null;
  samples: any[] | null;
  images: any[] | null;
  charts: any[] | null;
  materials: any[] | null;
  suggestions: string[];
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

export default {
  namespaced: true,
  state(): ResultsState {
    return {
      // TODO:
      articles: null,
      samples: null,
      images: null,
      charts: null,
      materials: null,
      suggestions: [],
      total: 0,
      isLoading: false,
      totalGrouping: {
        getArticles: 0,
        getSamples: 0,
        getImages: 0,
        getCharts: 0,
        getMaterials: 0,
      },
    };
  },
  mutations,
  actions,
  getters,
};
