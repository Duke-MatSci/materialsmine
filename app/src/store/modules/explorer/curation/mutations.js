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
  },
  setRorData (state, payload) {
    state.rorData = payload
  },
  setXmlBulkResponse (state, payload) {
    state.xmlBulkResponse = payload
  },
  setCurationFormData (state, payload) {
    state.curationFormData = payload
  },
  setCurationFormError (state, payload) {
    state.curationFormError = payload
  },
  setReplaceNestedRef (state, payload) {
    if (payload.length) {
      const data = state.replaceNestedRef.length
        ? [...state.replaceNestedRef, JSON.stringify(payload)]
        : [JSON.stringify(payload)]

      state.replaceNestedRef = [...new Set(data)]
    }
  },
  clearReplaceNestedRef (state) {
    state.replaceNestedRef = []
  }
}
