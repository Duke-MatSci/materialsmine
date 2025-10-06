/**
 * Explorer Store Module Types
 * Shared type definitions for the explorer store and its submodules
 */

// Main Explorer State
export interface ExplorerState {
  toggleMenuVisibility: boolean;
  enableAutosuggest: boolean;
  resultsTab: string;
  searchKeyword: string;
  searching: boolean;
  facetFilterMaterials: FacetFilterMaterial[];
  selectedFacetFilterMaterialsValue: string | null;
  selectedFacetFilterMaterials: SelectedFacetFilterMaterials;
  dataset: Dataset | null;
  datasetThumbnail: string;
  dynamfitDomain: string;
  dynamfitData: DynamfitData;
  dynamfit: DynamfitConfig;
}

export interface FacetFilterMaterial {
  [key: string]: unknown;
}

export interface SelectedFacetFilterMaterials {
  parsedResponseCount?: unknown[];
  parsedResponseDefinition?: unknown[];
  parsedResponseContent?: unknown[];
}

export interface Dataset {
  [key: string]: unknown;
}

export interface DynamfitData {
  'complex-chart'?: unknown;
  'complex-tand-chart'?: unknown;
  'complex-temp-chart'?: unknown;
  'temp-tand-chart'?: unknown;
  'relaxation-chart'?: unknown;
  'relaxation-spectrum-chart'?: unknown;
  mytable?: Record<string, unknown>[];
  'upload-data'?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface DynamfitConfig {
  range: number;
  fitSettings: boolean;
  model: string;
  fileUpload: string;
}

// Action Payloads
export interface SearchFacetFilterMaterialsPayload {
  [key: string]: unknown;
}

export interface FetchDynamfitDataPayload {
  fileName: string;
  numberOfProny?: number;
  model?: string;
  fitSettings?: boolean;
  useSample?: boolean;
  domain?: string;
}

export interface DuplicateXmlPayload {
  id: string;
  isNew: boolean;
}

export interface DuplicateXmlResponse {
  id: string;
  isNew: boolean;
}

export interface SetSearchingPayload {
  set: boolean;
}

// Curation State
export interface CurationState {
  datasetId: string | null;
  fieldNameSelected: string;
  newChartExist: boolean;
  doiData: unknown | null;
  orcidData: unknown | null;
  rorData: unknown[];
  xmlBulkResponse: unknown | null;
  replaceNestedRef: string[];
  curationFormData: CurationFormData;
  curationSheetStatus: Record<string, unknown>;
  curationFormError: Record<string, unknown>;
}

export interface CurationFormData {
  Control_ID?: {
    cellValue?: string;
    [key: string]: unknown;
  };
  CONTROL_ID?: {
    cellValue?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CreateDatasetIdPayload {
  isBulk?: boolean;
}

export interface DeleteEntityPayload {
  identifier: string;
  type: string;
}

export interface CacheEntityPayload {
  identifier: string;
  resourceNanopub: unknown;
  type: string;
}

export interface FetchXlsListPayload {
  field: string;
  pageNumber?: number;
}

export interface FetchCurationDataPayload {
  id: string;
  isNew?: boolean;
}

export interface SubmitCurationDataPayload {
  xlsxObjectId?: string | null;
  isNew?: boolean;
}

export interface DeleteCurationPayload {
  xmlId: string;
  isNew: boolean;
}

export interface SearchRorPayload {
  query?: string;
  id?: string;
}

export interface XmlData {
  id: string;
  title: string;
  xmlString: string;
  isNewCuration?: boolean;
}

export interface ApproveCurationPayload {
  xmlViewer: XmlData;
  callbackFn: () => void;
}

export interface RequestApprovalPayload {
  curationId: string;
  isNew: boolean;
}

export interface DeleteEntityFilesPayload {
  distribution: string[];
  thumbnail?: string;
}

// Gallery State
export interface GalleryState {
  items: GalleryItem[] | null;
  pageSize: number;
  page: number;
  queryTimeMillis: number;
  total: number;
  totalFavorites: number;
  missingCharts: unknown[];
  favoriteChartItems: FavoriteChartItem[];
}

export interface GalleryItem {
  _source?: unknown;
  [key: string]: unknown;
}

export interface FavoriteChartItem {
  chartId?: string;
  _source?: unknown;
  [key: string]: unknown;
}

export interface LoadItemsPayload {
  page?: number;
}

export interface BookmarkChartPayload {
  chart: {
    identifier: string;
    [key: string]: unknown;
  };
}

// Results State
export interface ResultsState {
  articles: Article[] | null;
  samples: Sample[] | null;
  images: ImageResult[] | null;
  charts: Chart[] | null;
  materials: Material[] | null;
  suggestions: string[];
  total: number;
  isLoading: boolean;
  totalGrouping: TotalGrouping;
}

export interface Article {
  [key: string]: unknown;
}

export interface Sample {
  [key: string]: unknown;
}

export interface Chart {
  [key: string]: unknown;
}

export interface ImageResult {
  file?: string;
  description?: string;
  type?: string;
  metaData?: {
    title?: string;
    id?: string;
  };
  [key: string]: unknown;
}

export interface Material {
  [key: string]: unknown;
}

export interface TotalGrouping {
  getArticles: number;
  getSamples: number;
  getImages: number;
  getCharts: number;
  getMaterials: number;
}

export interface OutboundSearchPayload {
  keyPhrase: string;
  type: 'search' | 'autosuggest';
}

export interface SearchResponseData {
  data?: {
    hits?: Array<{
      _index: string;
      _source: unknown;
    }>;
    searchImages?: {
      totalItems?: number;
      images?: ImageResult[];
    };
  };
  [key: string]: unknown;
}

export interface SearchAllPayload {
  searchKeyword: string;
  pageNumber: number;
  pageSize: number;
}

export interface SearchResponse {
  data?: unknown[];
  total?: number;
}

// SDD Datasets State
export interface SddDatasetsState {
  items: DatasetItem[];
  total: number;
  page: number;
  pageSize: number;
  queryTimeMillis: number;
}

export interface DatasetItem {
  _source?: unknown;
  [key: string]: unknown;
}

export interface LoadDatasetsPayload {
  page?: number;
}

export interface SearchDatasetKeywordPayload {
  searchTerm: string;
  page?: number;
}

export interface DatasetResponse {
  total?: number;
  data?: DatasetItem[];
}
