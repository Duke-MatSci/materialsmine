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
  dynamfitTransformMethod: 'none' | 'WLF' | 'hybrid' | 'manual';
  dynamfitManualFile: string;
  dynamfitShiftCoefficients: {
    C1: number | null;
    C2: number | null;
    Tg: number | null;
    Ea: number | null;
    TC: number | null;
    a_T_ref: number | null;
    // Reduced chi-squared of the /fit-shift coefficient fit (log10 space).
    chi2_reduced: number | null;
    // Which model produced the coefficients above. Distinct from
    // dynamfitTransformMethod, which says what drives the omega-T transform:
    // manual mode fits a WLF or hybrid curve to the uploaded shift table for
    // the shift figure while the table itself keeps doing the transforming.
    model: 'WLF' | 'hybrid' | null;
  };
  dynamfitSourceType: string;
  // The API only ever echoes the mangled upload name, so the catalog label and
  // the user's own filename are captured client-side at load time.
  dynamfitFileMeta: {
    label: string;
    originalName: string;
  };
  dynamfitSurpriseRequest: number;
  // Bumped when an Update click applies an omega-T transform, so the visualizer
  // can jump to the cross-domain tab for that click and only that click.
  dynamfitTransformTabRequest: number;
  // Bumped on every dynamfit reset so in-flight fits can tell they are stale.
  dynamfitResetCount: number;
  dynamfit: {
    range: number;
    fitSettings: boolean;
    model: string;
    fileUpload: string;
  };
}
