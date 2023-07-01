import { CREATE_DATASET_ID_MUTATION } from '@/modules/gql/dataset-gql'
import router from '@/router'
import apollo from '@/modules/gql/apolloClient'
import { deleteChart } from '@/modules/vega-chart'
import { isValidOrcid } from '@/modules/whyis-dataset'

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

  async lookupOrcid ({ commit }, orcidId) {
    const unhyphenated = /^\d{15}(\d|X)$/.test(orcidId)
    unhyphenated && (orcidId = orcidId.replace(/^\(?(\d{4})\)?(\d{4})?(\d{4})?(\d{3}(\d|X))$/, '$1-$2-$3-$4'))

    if (isValidOrcid(orcidId)) {
      // TODO: update the endpoint route name
      const url = `/api/knowledge/images?uri=http://orcid.org/${orcidId}&view=describe`
      const response = await fetch(url, {
        method: 'GET'
      })
      if (response?.statusText !== 'OK') {
        const snackbar = {
          message: response.message || 'Something went wrong while fetching orcid data',
          duration: 5000
        }
        return commit('setSnackbar', snackbar, { root: true })
      }

      const responseData = await response.json()
      const cpResult = responseData.filter(entry => entry['@id'] === `http://orcid.org/${orcidId}`)
      if (cpResult.length) {
        return commit('setOrcidData', cpResult[0])
      } else {
        // No results were returned
        return commit('setOrcidData', 'invalid')
      }
    } else {
      // Incorrect format
      return commit('setOrcidData', 'invalid')
    }
  },

  async lookupDoi ({ commit }, inputDoi) {
    const url = `/api/knowledge/getdoi/${inputDoi}`
    const response = await fetch(url, {
      method: 'GET'
    })
    if (response?.statusText !== 'OK') {
      const snackbar = {
        message: response.message || 'Something went wrong while fetching DOI data',
        duration: 5000
      }
      return commit('setSnackbar', snackbar, { root: true })
    }
    const responseData = await response.json()
    return commit('setDoiData', responseData)
  }
}
