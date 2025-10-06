import {
  ExplorerState,
  FacetFilterMaterial,
  SelectedFacetFilterMaterials,
  Dataset,
  DynamfitData,
  SetSearchingPayload,
} from './types';

export default {
  setMenuVisible(state: ExplorerState): void {
    state.toggleMenuVisibility = !state.toggleMenuVisibility;
  },
  setResultsTab(state: ExplorerState, payload: string): void {
    state.resultsTab = payload;
  },
  setSearchKeyword(state: ExplorerState, payload: string): void {
    state.searchKeyword = payload;
  },
  setFacetFilterMaterials(state: ExplorerState, payload: FacetFilterMaterial[]): void {
    state.facetFilterMaterials = payload;
  },
  setSelectedFacetFilterMaterials(state: ExplorerState, payload: SelectedFacetFilterMaterials): void {
    state.selectedFacetFilterMaterials = payload;
  },
  setSelectedFacetFilterMaterialsValue(state: ExplorerState, payload: string | null): void {
    state.selectedFacetFilterMaterialsValue = payload;
  },
  setSearching(state: ExplorerState, payload?: SetSearchingPayload): void {
    if (payload) {
      state.searching = payload.set;
      return;
    }

    if (state.searchKeyword && state.searchKeyword.length) {
      state.searching = true;
    }
  },
  setEnableAutosuggest(state: ExplorerState, payload: boolean): void {
    state.enableAutosuggest = payload;
  },
  setCurrentDataset(state: ExplorerState, payload: Dataset | null): void {
    state.dataset = payload;
  },
  setCurrentDatasetThumbnail(state: ExplorerState, payload: string): void {
    state.datasetThumbnail = payload;
  },
  setDynamfitData(state: ExplorerState, payload: DynamfitData): void {
    state.dynamfitData = payload;
  },
  resetDynamfitData(state: ExplorerState): void {
    state.dynamfitData = {};
  },
  resetDynamfit(state: ExplorerState): void {
    state.dynamfit = {
      range: 100,
      fitSettings: false,
      model: 'Linear',
      fileUpload: '',
    };
  },
  setDynamfitDomain(state: ExplorerState, payload: string): void {
    state.dynamfitDomain = payload;
  },
};
