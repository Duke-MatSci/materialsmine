import { CurationState } from './types';

export default {
  setDatasetId(state: CurationState, datasetId: string): void {
    state.datasetId = datasetId;
  },
  setFieldNameSelected(state: CurationState, fieldName: string): void {
    state.fieldNameSelected = fieldName;
  },
  setNewChartExist(state: CurationState, payload: boolean): void {
    // Using this to trigger a refresh after user creates a new chart
    state.newChartExist = payload;
  },
  setOrcidData(state: CurationState, payload: any): void {
    state.orcidData = payload;
  },
  setDoiData(state: CurationState, payload: any): void {
    state.doiData = payload;
  },
  setRorData(state: CurationState, payload: any[]): void {
    state.rorData = payload;
  },
  setXmlBulkResponse(state: CurationState, payload: any): void {
    state.xmlBulkResponse = payload;
  },
  setCurationFormData(state: CurationState, payload: Record<string, any>): void {
    state.curationFormData = payload;
  },
  setCurationFormError(state: CurationState, payload: Record<string, any>): void {
    state.curationFormError = payload;
  },
  setReplaceNestedRef(state: CurationState, payload: any[]): void {
    if (payload.length) {
      const data = state.replaceNestedRef.length
        ? [...state.replaceNestedRef, JSON.stringify(payload)]
        : [JSON.stringify(payload)];

      state.replaceNestedRef = [...new Set(data)];
    }
  },
  clearReplaceNestedRef(state: CurationState): void {
    state.replaceNestedRef = [];
  },
  setControlID(state: CurationState, payload: string): void {
    if (state.curationFormData?.Control_ID) {
      state.curationFormData.Control_ID.cellValue = payload;
    }
  },
  setChangeLogs(state: CurationState, payload: any[]): void {
    state.changeLogs = payload;
  },
};
