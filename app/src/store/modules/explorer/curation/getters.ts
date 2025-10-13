import { CurationState } from './types';

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
  getDoiData(state: CurationState): any {
    return state.doiData;
  },
  getOrcidData(state: CurationState): any {
    return state.orcidData;
  },
  getRorData(state: CurationState): any[] {
    return state.rorData;
  },
  getXmlBulkResponse(state: CurationState): any {
    return state.xmlBulkResponse;
  },
  getCurationFormData(state: CurationState): Record<string, any> {
    return state.curationFormData;
  }
};
