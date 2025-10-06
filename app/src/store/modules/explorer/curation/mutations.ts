import { CurationState, CurationFormData } from '../types';

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
  setOrcidData(state: CurationState, payload: unknown): void {
    state.orcidData = payload;
  },
  setDoiData(state: CurationState, payload: unknown): void {
    state.doiData = payload;
  },
  setRorData(state: CurationState, payload: unknown[]): void {
    state.rorData = payload;
  },
  setXmlBulkResponse(state: CurationState, payload: unknown): void {
    state.xmlBulkResponse = payload;
  },
  setCurationFormData(state: CurationState, payload: CurationFormData): void {
    state.curationFormData = payload;
  },
  setCurationFormError(state: CurationState, payload: Record<string, unknown>): void {
    state.curationFormError = payload;
  },
  setReplaceNestedRef(state: CurationState, payload: unknown[]): void {
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
};
