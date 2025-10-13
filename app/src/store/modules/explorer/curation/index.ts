import mutations from './mutations';
import actions from './actions';
import getters from './getters';
import { CurationState } from './types';

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
      curationFormError: {}
    };
  },
  mutations,
  actions,
  getters
};
