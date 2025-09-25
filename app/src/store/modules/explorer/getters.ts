import { ExplorerState } from './index';

export default {
  // Pagination getters
  currentPage: (state: ExplorerState) => state.currentPage,

  totalPages: (state: ExplorerState) => state.totalPages,

  itemsPerPage: (state: ExplorerState) => state.itemsPerPage,

  totalItems: (state: ExplorerState) => state.totalItems,

  hasNextPage: (state: ExplorerState) => state.currentPage < state.totalPages,

  hasPrevPage: (state: ExplorerState) => state.currentPage > 1,

  isFirstPage: (state: ExplorerState) => state.currentPage === 1,

  isLastPage: (state: ExplorerState) => state.currentPage === state.totalPages,

  // Search getters
  searchQuery: (state: ExplorerState) => state.searchQuery,

  searchResults: (state: ExplorerState) => state.searchResults,

  isLoading: (state: ExplorerState) => state.isLoading,

  error: (state: ExplorerState) => state.error,

  hasResults: (state: ExplorerState) => state.searchResults.length > 0,

  resultsCount: (state: ExplorerState) => state.searchResults.length,

  // Filter and sort getters
  filters: (state: ExplorerState) => state.filters,

  sortBy: (state: ExplorerState) => state.sortBy,

  sortOrder: (state: ExplorerState) => state.sortOrder,

  // Computed getters
  paginationInfo: (state: ExplorerState) => ({
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    itemsPerPage: state.itemsPerPage,
    totalItems: state.totalItems,
    startItem: (state.currentPage - 1) * state.itemsPerPage + 1,
    endItem: Math.min(state.currentPage * state.itemsPerPage, state.totalItems),
  }),

  searchInfo: (state: ExplorerState) => ({
    query: state.searchQuery,
    results: state.searchResults,
    count: state.searchResults.length,
    loading: state.isLoading,
    error: state.error,
  }),

  // Utility getters
  canGoNext: (state: ExplorerState) => state.currentPage < state.totalPages,

  canGoPrev: (state: ExplorerState) => state.currentPage > 1,

  pageRange: (state: ExplorerState) => {
    const start = Math.max(1, state.currentPage - 2);
    const end = Math.min(state.totalPages, state.currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  },

  // Facet filter getters
  getFacetFilterMaterials: (state: ExplorerState) => state.facetFilterMaterials,

  getSelectedFacetFilterMaterials: (state: ExplorerState) => state.selectedFacetFilterMaterials,

  getSelectedFacetFilterMaterialsValue: (state: ExplorerState) =>
    state.selectedFacetFilterMaterialsValue,
};
