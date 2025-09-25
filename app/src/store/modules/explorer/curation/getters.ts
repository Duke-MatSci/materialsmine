import { CurationState } from './index';

export default {
  datasetId(state: CurationState) {
    return state.datasetId;
  },
  getFieldNameSelected(state: CurationState) {
    return state.fieldNameSelected;
  },
  getNewChartExist(state: CurationState) {
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
