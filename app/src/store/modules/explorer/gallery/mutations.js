export default {
  setAllItems(state, allItems) {
    state.allItems = allItems;
  },
  setItems(state, items) {
    state.items = items;
  },
  setPage(state, page) {
    state.page = page;
  },
  setTotal(state, total) {
    state.total = total;
  },
  setQueryTimeMillis(state, queryTimeMillis) {
    state.queryTimeMillis = queryTimeMillis;
  },
  setfavoriteChartItems(state, items) {
    state.favoriteChartItems = items;
  },
  setMissingCharts(state, payload) {
    state.missingCharts = payload;
  },
  setTotalFavorites(state, totalFavorites) {
    state.totalFavorites = totalFavorites;
  }
};
