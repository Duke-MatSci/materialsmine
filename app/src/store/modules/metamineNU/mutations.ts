import { ProcessedData, RawData } from '@/modules/metamine/utils/processData';

export interface FetchedName {
  name: string;
  color: string;
}

export interface MetamineNUState {
  fetchedNames: FetchedName[];
  datasets: ProcessedData[];
  activeData: ProcessedData[];
  dataLibrary: any[];
  dataPoint: Partial<ProcessedData>;
  selectedData: ProcessedData[];
  page: string;
  query1: string | null;
  query2: string | null;
  neighbors: any[];
  reset: boolean;
  knnUmap: number;
  dialogBoxActiveKnn: boolean;
  enableKnn: boolean;
  refreshStatus: boolean;
  loadingState: boolean;
  rawJson: Record<string, RawData[]> | null;
}

export default {
  setDataPoint(state: MetamineNUState, payload: Partial<ProcessedData>) {
    state.dataPoint = payload;
  },
  setFetchedNames(state: MetamineNUState, payload: FetchedName[]) {
    state.fetchedNames = payload;
  },
  setDatasets(state: MetamineNUState, payload: ProcessedData[]) {
    state.datasets = payload;
  },
  setActiveData(state: MetamineNUState, payload: ProcessedData[]) {
    state.activeData = payload;
  },
  setDataLibrary(state: MetamineNUState, payload: any[]) {
    state.dataLibrary = payload;
  },
  setSelectedData(state: MetamineNUState, payload: ProcessedData[]) {
    state.selectedData = payload;
  },
  setPage(state: MetamineNUState, payload: string) {
    state.page = payload;
  },
  setQuery1(state: MetamineNUState, payload: string | null) {
    state.query1 = payload;
  },
  setQuery2(state: MetamineNUState, payload: string | null) {
    state.query2 = payload;
  },
  setNeighbors(state: MetamineNUState, payload: any[]) {
    state.neighbors = payload;
  },
  setReset(state: MetamineNUState, payload: boolean) {
    state.reset = payload;
  },
  setKnnUmap(state: MetamineNUState, payload: number) {
    state.knnUmap = payload;
  },
  setDialogBoxActiveKnn(state: MetamineNUState, payload: boolean) {
    state.dialogBoxActiveKnn = payload;
  },
  updateEnableKnn(state: MetamineNUState, payload: boolean) {
    state.enableKnn = payload;
  },
  setRefreshStatus(state: MetamineNUState, payload: boolean) {
    state.refreshStatus = payload;
  },
  setLoadingState(state: MetamineNUState, payload: boolean) {
    state.loadingState = payload;
  },
  setRawJsonFile(state: MetamineNUState, payload: Record<string, RawData[]> | null) {
    state.rawJson = payload;
  }
};
