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
  setXlsxCurationStep (state, { stepNumber, stepDictionary }) {
    state.xlsxCurationData[stepNumber] = stepDictionary
  },
  setNestedObject (state, { stepNumber, pathArr, value }) {
    var schema = state.xlsxCurationData[stepNumber]
    var len = pathArr.length
    for (let i = 0; i < len - 1; i++) {
      var elem = pathArr[i]
      if (!schema[elem]) schema[elem] = {}
      schema = schema[elem]
    }
    if (Array.isArray(schema)) {
      schema.push(value)
    } else schema[pathArr[len - 1]].value = value
  }
}
