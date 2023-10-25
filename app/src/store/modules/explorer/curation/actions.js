import { CREATE_DATASET_ID_MUTATION } from '@/modules/gql/dataset-gql'
import { SEARCH_SPREADSHEETLIST_QUERY } from '@/modules/gql/material-gql.js'
import router from '@/router'
import apollo from '@/modules/gql/apolloClient'
import { deleteChart } from '@/modules/vega-chart'
import { isValidOrcid } from '@/modules/whyis-dataset'

export default {
  async createDatasetIdVuex ({ commit, dispatch }) {
    await apollo
      .mutate({
        mutation: CREATE_DATASET_ID_MUTATION
      })
      .then((result) => {
        const datasetId = result.data.createDatasetId.datasetGroupId
        commit('setDatasetId', datasetId)
        router.push({ name: 'CurateSpreadsheet', params: { datasetId } })
      })
      .catch((error) => {
        if (error.message.includes('unused datasetId')) {
          const datasetId = error.message.split('-')[1]?.split(' ')[1]
          commit('setDatasetId', datasetId)
          router.push({ name: 'CurateSpreadsheet', params: { datasetId } })
        } else {
          // Show error in snackbar and pass current function as callback
          commit(
            'setSnackbar',
            {
              message: error.message,
              action: () => {
                dispatch('createDatasetIdVuex')
              }
            },
            { root: true }
          )
        }
      })
  },

  async createChartInstanceObject (_context, nanopubPayload) {
    const chartObject =
      nanopubPayload?.['@graph']?.['np:hasAssertion']?.['@graph'][0]

    // Return if not able to retrieve chart object
    if (!chartObject) { return new Error('Caching error. Chart object is missing') }

    // Build chart instance object
    return {
      description:
        chartObject['http://purl.org/dc/terms/description']?.[0]?.['@value'],
      identifier: chartObject['@id'],
      label: chartObject['http://purl.org/dc/terms/title']?.[0]?.['@value'],
      thumbnail: chartObject['http://xmlns.com/foaf/0.1/depiction']?.['@id']
      // depiction: chartObject['http://xmlns.com/foaf/0.1/depiction']?.['http://vocab.rpi.edu/whyis/hasContent']
    }
  },

  async deleteChartNanopub (_context, chartUri) {
    const response = await deleteChart(chartUri)
    return response
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
    const chartInstanceObject = await dispatch(
      'createChartInstanceObject',
      chartNanopub
    )
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
      return new Error(
        fetchResponse.statusText || 'Server error, cannot cache chart'
      )
    }

    const response = await fetchResponse.json()
    return { response, identifier: chartInstanceObject.identifier }
  },

  async lookupOrcid ({ commit }, orcidId) {
    const unhyphenated = /^\d{15}(\d|X)$/.test(orcidId)
    unhyphenated &&
      (orcidId = orcidId.replace(
        /^\(?(\d{4})\)?(\d{4})?(\d{4})?(\d{3}(\d|X))$/,
        '$1-$2-$3-$4'
      ))

    if (isValidOrcid(orcidId)) {
      // TODO: update the endpoint route name
      // const url = `/api/knowledge/images?uri=http://orcid.org/${orcidId}&view=describe`;
      const url = `/api/knowledge/instance?uri=http://orcid.org/${orcidId}`
      const response = await fetch(url, {
        method: 'GET'
      })
      if (response?.statusText !== 'OK') {
        const snackbar = {
          message:
            response.message ||
            'Something went wrong while fetching orcid data',
          duration: 5000
        }
        return commit('setSnackbar', snackbar, { root: true })
      }

      const responseData = await response.json()
      const cpResult = responseData.filter(
        (entry) => entry['@id'] === `http://orcid.org/${orcidId}`
      )
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
        message:
          response.message || 'Something went wrong while fetching DOI data',
        duration: 5000
      }
      return commit('setSnackbar', snackbar, { root: true })
    }
    const responseData = await response.json()
    return commit('setDoiData', responseData)
  },
  async submitBulkXml ({ commit, rootGetters }, files) {
    const token = rootGetters['auth/token']
    const url = `${window.location.origin}/api/curate/bulk`
    const formData = new FormData()
    files.forEach((file) => formData.append('uploadfile', file))
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      redirect: 'follow',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    if (response?.statusText !== 'OK') {
      throw new Error(
        response.message || 'Something went wrong while submitting XMLs'
      )
    }
    const result = await response.json()
    commit('setXmlBulkResponse', result)
    return response
  },
  async fetchXlsList (_context, payload) {
    if (!payload.field) return
    const response = await apollo.query({
      query: SEARCH_SPREADSHEETLIST_QUERY,
      variables: {
        input: {
          field: payload.field,
          pageNumber: payload?.pageNumber ?? 1,
          pageSize: 20
        }
      },
      fetchPolicy: 'no-cache'
    })
    if (!response) {
      const error = new Error('Server error: Unable to access list!')
      throw error
    }
    const result = response?.data?.getXlsxCurationList || {}
    return result
  },
  async fetchCurationData ({ commit, getters, rootGetters }, payload = null) {
    const url = !payload
      ? '/api/curate'
      : `/api/curate/get/${payload.id}?isNew=${payload?.isNew}`
    const token = rootGetters['auth/token']
    const curationData = getters?.getCurationFormData ?? {}

    if (Object.keys(curationData).length && !payload) return curationData

    const fetchResponse = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + token
      }
    })

    if (fetchResponse.status !== 200) {
      throw new Error(
        fetchResponse.statusText || 'Server error, cannot fetch JSON'
      )
    }
    const response = await fetchResponse.json()
    commit('setCurationFormData', response)
  },
  async submitCurationData (
    { state, commit, rootGetters },
    { xlsxObjectId = null, isNew = true } = {}
  ) {
    const cId =
      state.curationFormData.Control_ID ??
      state.curationFormData.CONTROL_ID ??
      {}

    if (!cId?.cellValue) {
      throw new Error('Please enter Control_ID before submitting')
    }

    if (Object.keys(state.curationFormError).length) {
      throw new Error('Field Error: Please fill all required fields')
    }

    const data = JSON.parse(JSON.stringify(state.curationFormData))
    // Process all replace nested field
    const replaceNestedRef = state.replaceNestedRef
    for (let i = 0; i < replaceNestedRef.length; i++) {
      var element = JSON.parse(replaceNestedRef[i])
      const title = element.shift()
      const lastKey = element.pop()
      const refData = element.reduce(function (o, x) {
        return typeof o === 'undefined' || o === null ? o : o[x]
      }, data[title])
      refData[lastKey] = refData[lastKey].values
    }
    const url = !xlsxObjectId
      ? '/api/curate?isBaseObject=true'
      : `/api/curate?xlsxObjectId=${xlsxObjectId}&isBaseUpdate=true&isNew=${isNew}`
    const method = !xlsxObjectId ? 'POST' : 'PUT'
    const successResponse = !xlsxObjectId ? 201 : 200
    const requestBody = !xlsxObjectId
      ? JSON.stringify({ curatedjsonObject: data })
      : JSON.stringify({ payload: data })

    const token = rootGetters['auth/token']

    const fetchResponse = await fetch(url, {
      method: method,
      body: requestBody,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    })

    if (fetchResponse.status === 409) {
      const response = await fetchResponse.json()
      const message = response?.message ?? 'Duplicate Curation'
      throw new Error(`${fetchResponse?.statusText}: ${message}`)
    }

    if (fetchResponse.status === 400) {
      const response = await fetchResponse.json()
      const errorObj = response?.fieldError ?? {}
      commit('setCurationFormError', errorObj)
      throw new Error('Field Error: Please fill all required fields')
    }

    if (fetchResponse.status !== successResponse) {
      throw new Error(
        fetchResponse.statusText || 'Server error, cannot fetch JSON'
      )
    }
    if (fetchResponse.status === successResponse) {
      const response = await fetchResponse.json()
      var sampleId = xlsxObjectId ?? response?.sampleID ?? ''
      if (sampleId) {
        router.push({
          name: 'XmlVisualizer',
          params: { id: sampleId },
          query: { isNewCuration: isNew }
        })
      } else {
        router.push({ name: 'XmlGallery' })
      }
      commit('setCurationFormData', {})
      const snackbar = {
        message: 'Curation Successful',
        duration: 10000
      }
      return commit('setSnackbar', snackbar, { root: true })
    }
  },
  async searchRor ({ commit }, payload) {
    const { query, id } = payload
    let url
    if (query) url = `/api/knowledge/ror?query=${query}`
    else if (id) url = `/api/knowledge/ror?id=${id}`
    else {
      const snackbar = {
        message: 'Missing parameter from ROR search',
        duration: 10000
      }
      return commit('setSnackbar', snackbar, { root: true })
    }
    const response = await fetch(url, {
      method: 'GET'
    })
    if (response?.statusText !== 'OK') {
      const snackbar = {
        message:
          response.message || 'Something went wrong while fetching ROR data',
        duration: 5000
      }
      return commit('setSnackbar', snackbar, { root: true })
    }
    const responseData = await response.json()
    commit('setRorData', responseData)
    return responseData
  }
}
