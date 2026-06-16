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
  dynamfitTransformMethod: 'none' | 'WLF' | 'hybrid';
  dynamfitManualFile: string;
  dynamfitShiftCoefficients: {
    C1: number | null;
    C2: number | null;
    Tg: number | null;
    Ea: number | null;
    TL: number | null;
    a_T_ref: number | null;
  };
  dynamfit: {
    range: number;
    fitSettings: boolean;
    model: string;
    fileUpload: string;
  };
}
