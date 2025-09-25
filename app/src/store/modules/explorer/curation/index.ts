import mutations from './mutations';
import actions from './actions';
import getters from './getters';

export interface CurationState {
  datasetId: string | null;
  fieldNameSelected: string;
  newChartExist: boolean;
  doiData: any;
  orcidData: any;
  rorData: any[];
  xmlBulkResponse: any;
  replaceNestedRef: string[];
  curationFormData: any;
  curationSheetStatus: any;
  curationFormError: any;
}

export default {
  namespaced: true,
  state(): CurationState {
    return {
      datasetId: null,
      fieldNameSelected: '',
      newChartExist: false,
      doiData: null,
      orcidData: null,
      rorData: [],
      xmlBulkResponse: null,
      replaceNestedRef: [],
      curationFormData: {},
      curationSheetStatus: {},
      curationFormError: {},
    };
  },
  mutations,
  actions,
  getters,
};
