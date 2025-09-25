import { CurationState } from './index';

export default {
  setDatasetId(state: CurationState, datasetId: string) {
    state.datasetId = datasetId;
  },
  setFieldNameSelected(state: CurationState, fieldName: string) {
    state.fieldNameSelected = fieldName;
  },
  setNewChartExist(state: CurationState, payload: boolean) {
    // Using this to trigger a refresh after user creates a new chart
    state.newChartExist = payload;
  },
  setOrcidData(state: CurationState, payload: any) {
    state.orcidData = payload;
  },
  setDoiData(state: CurationState, payload: any) {
    state.doiData = payload;
  },
  setRorData(state: CurationState, payload: any[]) {
    state.rorData = payload;
  },
  setXmlBulkResponse(state: CurationState, payload: any) {
    state.xmlBulkResponse = payload;
  },
  setCurationFormData(state: CurationState, payload: any) {
    state.curationFormData = payload;
  },
  setCurationFormError(state: CurationState, payload: any) {
    state.curationFormError = payload;
  },
  setReplaceNestedRef(state: CurationState, payload: any[]) {
    if (payload.length) {
      const data = state.replaceNestedRef.length
        ? [...state.replaceNestedRef, JSON.stringify(payload)]
        : [JSON.stringify(payload)];

      state.replaceNestedRef = [...new Set(data)];
    }
  },
  clearReplaceNestedRef(state: CurationState) {
    state.replaceNestedRef = [];
  },
  setControlID(state: CurationState, payload: string) {
    if (state.curationFormData?.Control_ID) {
      state.curationFormData.Control_ID.cellValue = payload;
    }
  },
};
