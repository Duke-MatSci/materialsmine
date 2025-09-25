import { ActionContext } from 'vuex';
import { ExplorerState } from './index';

export default {
  // Pagination actions
  async setCurrentPage({ commit }: ActionContext<ExplorerState, any>, page: number) {
    commit('SET_CURRENT_PAGE', page);
  },

  async setTotalPages({ commit }: ActionContext<ExplorerState, any>, pages: number) {
    commit('SET_TOTAL_PAGES', pages);
  },

  async setItemsPerPage({ commit }: ActionContext<ExplorerState, any>, items: number) {
    commit('SET_ITEMS_PER_PAGE', items);
    // Recalculate total pages when items per page changes
    const state = commit as any;
    const totalPages = Math.ceil(state.totalItems / items);
    commit('SET_TOTAL_PAGES', totalPages);
    commit('SET_CURRENT_PAGE', 1); // Reset to first page
  },

  async setTotalItems({ commit }: ActionContext<ExplorerState, any>, total: number) {
    commit('SET_TOTAL_ITEMS', total);
    // Recalculate total pages
    const state = commit as any;
    const totalPages = Math.ceil(total / state.itemsPerPage);
    commit('SET_TOTAL_PAGES', totalPages);
  },

  // Search actions
  async setSearchQuery({ commit }: ActionContext<ExplorerState, any>, query: string) {
    commit('SET_SEARCH_QUERY', query);
    commit('SET_CURRENT_PAGE', 1); // Reset to first page when searching
  },

  async setSearchResults({ commit }: ActionContext<ExplorerState, any>, results: any[]) {
    commit('SET_SEARCH_RESULTS', results);
  },

  async setLoading({ commit }: ActionContext<ExplorerState, any>, loading: boolean) {
    commit('SET_LOADING', loading);
  },

  async setError({ commit }: ActionContext<ExplorerState, any>, error: string | null) {
    commit('SET_ERROR', error);
  },

  // Filter and sort actions
  async setFilters({ commit }: ActionContext<ExplorerState, any>, filters: Record<string, any>) {
    commit('SET_FILTERS', filters);
    commit('SET_CURRENT_PAGE', 1); // Reset to first page when filtering
  },

  async setSortBy({ commit }: ActionContext<ExplorerState, any>, sortBy: string) {
    commit('SET_SORT_BY', sortBy);
  },

  async setSortOrder({ commit }: ActionContext<ExplorerState, any>, order: 'asc' | 'desc') {
    commit('SET_SORT_ORDER', order);
  },

  // Reset actions
  async resetPagination({ commit }: ActionContext<ExplorerState, any>) {
    commit('RESET_PAGINATION');
  },

  async resetSearch({ commit }: ActionContext<ExplorerState, any>) {
    commit('RESET_SEARCH');
  },

  // Combined actions
  async goToPage({ commit, dispatch }: ActionContext<ExplorerState, any>, page: number) {
    commit('SET_CURRENT_PAGE', page);
    // You can add additional logic here, such as fetching data for the new page
    // await dispatch('fetchSearchResults');
  },

  async performSearch({ commit, dispatch }: ActionContext<ExplorerState, any>, query: string) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      await dispatch('setSearchQuery', query);
      // await dispatch('fetchSearchResults');
      // This is where you would typically make an API call
    } catch (error) {
      commit('SET_ERROR', error instanceof Error ? error.message : 'Search failed');
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Facet filter actions
  async searchFacetFilterMaterials(
    { commit }: ActionContext<ExplorerState, any>,
    selectedValue: string
  ) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      // This would typically make an API call to search for facet filter materials
      // For now, we'll just set the selected value
      commit('SET_SELECTED_FACET_FILTER_MATERIALS_VALUE', selectedValue);
      // You would add the actual API call here
      // const response = await api.searchFacetFilterMaterials(selectedValue);
      // commit('SET_SELECTED_FACET_FILTER_MATERIALS', response);
    } catch (error) {
      commit('SET_ERROR', error instanceof Error ? error.message : 'Facet filter search failed');
    } finally {
      commit('SET_LOADING', false);
    }
  },
};
