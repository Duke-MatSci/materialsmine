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
  getFacetFilterMaterials(state: ExplorerState): any[] {
    return state.facetFilterMaterials;
  },
  getSelectedFacetFilterMaterials(state: ExplorerState): Record<string, any> {
    return state.selectedFacetFilterMaterials;
  },
  getSelectedFacetFilterMaterialsValue(state: ExplorerState): string | null {
    return state.selectedFacetFilterMaterialsValue;
  },
  getAutosuggest(state: ExplorerState): boolean {
    return state.enableAutosuggest;
  },
  getCurrentDataset(state: ExplorerState): any {
    return state.dataset;
  },
  getDatasetThumbnail(state: ExplorerState): string {
    return state.datasetThumbnail;
  },
  getDynamfitData(state: ExplorerState): Record<string, any> {
    return state.dynamfitData;
  },
  getDynamfitDomain(state: ExplorerState): string {
    return state.dynamfitDomain;
  },
  dynamfit(state: ExplorerState): {
    range: number;
    fitSettings: boolean;
    model: string;
    fileUpload: string;
  } {
    return state.dynamfit;
  }
};
