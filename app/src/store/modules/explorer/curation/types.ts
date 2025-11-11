export interface CurationState {
  datasetId: string | null;
  fieldNameSelected: string;
  newChartExist: boolean;
  doiData: any;
  orcidData: any;
  rorData: any[];
  xmlBulkResponse: any;
  replaceNestedRef: any[];
  curationFormData: Record<string, any>;
  curationSheetStatus: Record<string, any>;
  curationFormError: Record<string, any>;
  changeLogs: any[];
}
