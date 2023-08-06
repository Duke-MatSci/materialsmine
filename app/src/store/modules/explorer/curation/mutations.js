export default {
  setDatasetId (state, datasetId) {
    state.datasetId = datasetId
  },
  setFieldNameSelected (state, fieldName) {
    state.fieldNameSelected = fieldName
  },
  setNewChartExist (state, payload) {
    // Using this to trigger a refresh after user creates a new chart
    state.newChartExist = payload
  },
  setOrcidData (state, payload) {
    state.orcidData = payload
  },
  setDoiData (state, payload) {
    state.doiData = payload
  }
}
