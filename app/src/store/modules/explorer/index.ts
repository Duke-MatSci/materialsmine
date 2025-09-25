import mutations from './mutations';
import actions from './actions';
import getters from './getters';
import curation from './curation';
import gallery from './gallery';
import results from './results';

export interface ExplorerState {
  // Pagination state
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;

  // Search and results state
  searchQuery: string;
  searchResults: any[];
  isLoading: boolean;
  error: string | null;

  // Filters and sorting
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Facet filter state
  facetFilterMaterials: any[];
  selectedFacetFilterMaterialsValue: string | null;
  selectedFacetFilterMaterials: any;
}

export default {
  namespaced: true,
  state(): ExplorerState {
    return {
      // Pagination state
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 20,
      totalItems: 0,

      // Search and results state
      searchQuery: '',
      searchResults: [],
      isLoading: false,
      error: null,

      // Filters and sorting
      filters: {},
      sortBy: '',
      sortOrder: 'asc',

      // Facet filter state
      facetFilterMaterials: [],
      selectedFacetFilterMaterialsValue: null,
      selectedFacetFilterMaterials: {},
    };
  },
  mutations,
  actions,
  getters,
  modules: {
    curation,
    gallery,
    results,
  },
};
