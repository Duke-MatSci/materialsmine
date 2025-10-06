import { CurationState } from '../types';

export default {
  datasetId(state: CurationState): string | null {
    return state.datasetId;
  },
  getFieldNameSelected(state: CurationState): string {
    return state.fieldNameSelected;
  },
  getNewChartExist(state: CurationState): boolean {
    return state.newChartExist;
  },
  getDoiData(state: CurationState) {
    return state.doiData;
  },
  getOrcidData(state: CurationState) {
    return state.orcidData;
  },
  getRorData(state: CurationState) {
    return state.rorData;
  },
  getXmlBulkResponse(state: CurationState) {
    return state.xmlBulkResponse;
  },
  getCurationFormData(state: CurationState) {
    return state.curationFormData;
  },
};
