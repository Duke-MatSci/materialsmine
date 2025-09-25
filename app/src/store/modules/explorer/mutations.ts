import { ExplorerState } from './index';

export default {
  // Pagination mutations
  SET_CURRENT_PAGE(state: ExplorerState, page: number) {
    state.currentPage = page;
  },

  SET_TOTAL_PAGES(state: ExplorerState, pages: number) {
    state.totalPages = pages;
  },

  SET_ITEMS_PER_PAGE(state: ExplorerState, items: number) {
    state.itemsPerPage = items;
  },

  SET_TOTAL_ITEMS(state: ExplorerState, total: number) {
    state.totalItems = total;
  },

  // Search mutations
  SET_SEARCH_QUERY(state: ExplorerState, query: string) {
    state.searchQuery = query;
  },

  SET_SEARCH_RESULTS(state: ExplorerState, results: any[]) {
    state.searchResults = results;
  },

  SET_LOADING(state: ExplorerState, loading: boolean) {
    state.isLoading = loading;
  },

  SET_ERROR(state: ExplorerState, error: string | null) {
    state.error = error;
  },

  // Filter and sort mutations
  SET_FILTERS(state: ExplorerState, filters: Record<string, any>) {
    state.filters = filters;
  },

  SET_SORT_BY(state: ExplorerState, sortBy: string) {
    state.sortBy = sortBy;
  },

  SET_SORT_ORDER(state: ExplorerState, order: 'asc' | 'desc') {
    state.sortOrder = order;
  },

  // Reset mutations
  RESET_PAGINATION(state: ExplorerState) {
    state.currentPage = 1;
    state.totalPages = 1;
    state.totalItems = 0;
  },

  RESET_SEARCH(state: ExplorerState) {
    state.searchQuery = '';
    state.searchResults = [];
    state.error = null;
  },

  // Facet filter mutations
  SET_FACET_FILTER_MATERIALS(state: ExplorerState, materials: any[]) {
    state.facetFilterMaterials = materials;
  },

  SET_SELECTED_FACET_FILTER_MATERIALS(state: ExplorerState, materials: any) {
    state.selectedFacetFilterMaterials = materials;
  },

  SET_SELECTED_FACET_FILTER_MATERIALS_VALUE(state: ExplorerState, value: string | null) {
    state.selectedFacetFilterMaterialsValue = value;
  },
};
