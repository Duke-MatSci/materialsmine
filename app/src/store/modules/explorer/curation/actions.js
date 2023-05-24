import { CREATE_DATASET_ID_MUTATION } from '@/modules/gql/dataset-gql'
import router from '@/router'
import apollo from '@/modules/gql/apolloClient'
import { deleteChart } from '@/modules/vega-chart'

export default {
  async createDatasetIdVuex ({ commit, dispatch }) {
    await apollo.mutate({
      mutation: CREATE_DATASET_ID_MUTATION
    }).then((result) => {
      const datasetId = result.data.createDatasetId.datasetGroupId
      commit('setDatasetId', datasetId)
      router.push({ name: 'CurateSpreadsheet', params: { datasetId } })
    }).catch((error) => {
      if (error.message.includes('unused datasetId')) {
        const datasetId = error.message.split('-')[1]?.split(' ')[1]
        commit('setDatasetId', datasetId)
        router.push({ name: 'CurateSpreadsheet', params: { datasetId } })
      } else {
        // Show error in snackbar and pass current function as callback
        commit('setSnackbar', {
          message: error.message,
          action: () => { dispatch('createDatasetIdVuex') }
        }, { root: true })
      }
    })
  },

  async createChartInstanceObject (_context, nanopubPayload) {
    const chartObject = nanopubPayload?.['@graph']?.['np:hasAssertion']?.['@graph'][0]

    // Return if not able to retrieve chart object
    if (!chartObject) return new Error('Caching error. Chart object is missing')

    // Build chart instance object
    return {
      description: chartObject['http://purl.org/dc/terms/description']?.[0]?.['@value'],
      identifier: chartObject['@id'],
      label: chartObject['http://purl.org/dc/terms/title']?.[0]?.['@value'],
      thumbnail: chartObject['http://xmlns.com/foaf/0.1/depiction']?.['@id']
      // depiction: chartObject['http://xmlns.com/foaf/0.1/depiction']?.['http://vocab.rpi.edu/whyis/hasContent']
    }
  },

  async deleteChartNanopub (_context, chartUri) {
    const response = await deleteChart(chartUri)
    return (response)
  },

  async deleteChartES ({ _, __, rootGetters }, identifier) {
    const url = '/api/admin/es'
    const token = rootGetters['auth/token']
    await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ doc: identifier, type: 'charts' })
    })
  },

  async cacheNewChartResponse ({ commit, dispatch, rootGetters }, payload) {
    const { identifier, chartNanopub } = payload
    const url = '/api/admin/es'
    const chartInstanceObject = await dispatch('createChartInstanceObject', chartNanopub)
    const token = rootGetters['auth/token']

    // 1. Check if a chart with same identifier exist in ES and delete
    if (identifier) {
      await dispatch('deleteChartES', identifier)
    }

    const fetchResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ doc: chartInstanceObject, type: 'charts' })
    })

    if (fetchResponse.status !== 200) {
      return new Error(fetchResponse.statusText || 'Server error, cannot cache chart')
    }

    const response = await fetchResponse.json()
    return { response, identifier: chartInstanceObject.identifier }
  },

  async fetchXlsxJsonStep (context, payload) {
    const { stepNumber, stepName } = payload
    const url = `/api/curate?sheetName=${stepName}`
    const token = context.rootGetters['auth/token']
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        }
      })
      if (!response || response.statusText !== 'OK') {
        const error = new Error(
          response?.message || 'Something went wrong!'
        )
        throw error
      }
      const responseData = await response.json()
      context.commit('setXlsxCurationStep', { stepNumber, stepDictionary: responseData })
      return responseData
    } catch (error) {
      const snackbar = {
        message: 'Something went wrong while fetching form fields!',
        action: () => context.dispatch('fetchXlsxJsonStep', payload)
      }
      return context.commit('setSnackbar', snackbar, { root: true })
    }
  },

  createXlsxFormStep ({ commit }, payload) {
    const { stepNumber, stepDictionary } = payload
    commit('setXlsxCurationStep', { stepNumber, stepDictionary })
  },

  addXlsxMultiple ({ commit, getters }, payload) {
    const { stepNumber, stepDict } = payload
    /** *
     * Pseudo code:
     * Find the entry for this type (e.g., Author)
     * Look at the dictionary structure for the first thing in the list (element 0)
     * Copy that structure but replace all 'value' with ''
     * Check the current length of the field (e.g., how many authors)
     * Add the new path to this new entry onto entries
     * Call setNestedObject with the new structure and new vmodel
     *
    */
    var schema = getters.getSingleXlsxStep(stepNumber)

    for (let i = 0; i < stepDict.length; i++) {
      var elem = stepDict[i]
      if (!schema[elem]) schema[elem] = {}
      schema = schema[elem]
    }
    const totalItems = schema?.values?.length ?? 0
    const firstItem = schema?.values[0]

    const resetNestedObject = (obj, newNumber, newObj = {}) => {
      const regex = /[A-Za-z0-9]+\s#[0-9]+/i
      if (typeof obj !== 'object') return obj
      for (const key in obj) {
        if (key === 'value') { newObj[key] = '' } else if (regex.test(key)) {
          const newKey = key.split('#')[0] + `#${newNumber}`
          newObj[newKey] = resetNestedObject(obj[key], newNumber)
        } else {
          newObj[key] = resetNestedObject(obj[key], newNumber)
        }
      } return newObj
    }
    const newItem = resetNestedObject(firstItem, totalItems + 1)
    commit('setNestedObject', {
      stepNumber,
      pathArr: [...stepDict, 'values', totalItems],
      value: newItem
    })
  }
}
