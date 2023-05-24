export default {
  datasetId (state) {
    return state.datasetId
  },
  getFieldNameSelected (state) {
    return state.fieldNameSelected
  },
  getNewChartExist (state) {
    return state.newChartExist
  },
  getXlsxCurationField: (state) => (step, pathArr = []) => {
    const nestedObj = state.xlsxCurationData[step.toString()]
    const field = pathArr.reduce((obj, key) =>
      (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj)
    const regex = /[A-Za-z0-9]+.*\|\[[^\]]*\]/i // Default value
    if (regex.test(field.value)) return '' // It hasn't been set yet
    else return field.value
  },
  getSingleXlsxStep: (state) => (step) => {
    return state.xlsxCurationData[step.toString()]
  }
}
