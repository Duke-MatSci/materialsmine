import { CREATE_DATASET_ID_MUTATION } from '@/modules/gql/dataset-gql'
import router from '@/router'
import apollo from '@/modules/gql/apolloClient'

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

  async cacheNewChartResponse ({ commit, dispatch, rootGetters }, nanopubPayload) {
    const url = '/api/admin/es'
    const chartInstanceObject = await dispatch('createChartInstanceObject', nanopubPayload)
    const token = rootGetters['auth/token']

    // 1. Check if a chart with same identifier exist in ES and delete
    await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ doc: chartInstanceObject.identifier, type: 'charts' })
    })

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ doc: chartInstanceObject, type: 'charts' })
    })

    if (response.status !== 200) {
      return new Error(response.message || 'Server error, cannot cache chart')
    }

    return response
  }
}
