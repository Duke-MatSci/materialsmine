export interface ExplorerState {
  toggleMenuVisibility: boolean;
  enableAutosuggest: boolean;
  resultsTab: string;
  searchKeyword: string;
  searching: boolean;
  facetFilterMaterials: any[];
  selectedFacetFilterMaterialsValue: string | null;
  selectedFacetFilterMaterials: Record<string, any>;
  dataset: any;
  datasetThumbnail: string;
  dynamfitDomain: string;
  dynamfitData: Record<string, any>;
  dynamfitTransformMethod: 'none' | 'WLF' | 'Manual';
  dynamfitManualFile: string;
  dynamfit: {
    range: number;
    fitSettings: boolean;
    model: string;
    fileUpload: string;
  };
}
