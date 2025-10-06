import { ExplorerState } from './types';

export default {
  menuVisible(state: ExplorerState): boolean {
    return state.toggleMenuVisibility;
  },
  getResultsTab(state: ExplorerState): string {
    return state.resultsTab;
  },
  getSearchKeyword(state: ExplorerState): string {
    return state.searchKeyword;
  },
  getSearching(state: ExplorerState): boolean {
    return state.searching;
  },
  getFacetFilterMaterials(state: ExplorerState) {
    return state.facetFilterMaterials;
  },
  getSelectedFacetFilterMaterials(state: ExplorerState) {
    return state.selectedFacetFilterMaterials;
  },
  getSelectedFacetFilterMaterialsValue(state: ExplorerState): string | null {
    return state.selectedFacetFilterMaterialsValue;
  },
  getAutosuggest(state: ExplorerState): boolean {
    return state.enableAutosuggest;
  },
  getCurrentDataset(state: ExplorerState) {
    return state.dataset;
  },
  getDatasetThumbnail(state: ExplorerState): string {
    return state.datasetThumbnail;
  },
  getDynamfitData(state: ExplorerState) {
    return state.dynamfitData;
  },
  getDynamfitDomain(state: ExplorerState): string {
    return state.dynamfitDomain;
  },
  dynamfit(state: ExplorerState) {
    return state.dynamfit;
  },
};
