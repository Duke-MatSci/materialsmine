import { CREATE_DATASET_ID_MUTATION } from '@/modules/gql/dataset-gql'
import { SEARCH_SPREADSHEETLIST_QUERY } from '@/modules/gql/material-gql.js'
import router from '@/router'
import apollo from '@/modules/gql/apolloClient'
import { deleteChart, saveXml } from '@/modules/vega-chart'
import { isValidOrcid } from '@/modules/whyis-dataset'

export default {
  async createDatasetIdVuex ({ commit, dispatch }, { isBulk = false }) {
    await apollo
      .mutate({
        mutation: CREATE_DATASET_ID_MUTATION
      })
      .then((result) => {
        const datasetId = result.data.createDatasetId.datasetGroupId
        commit('setDatasetId', datasetId)
        if (isBulk) return
        router.push({ name: 'CurateSpreadsheet', params: { datasetId } })
      })
      .catch((error) => {
        if (error.message.includes('unused datasetId')) {
          const datasetId = error.message.split('-')[1]?.split(' ')[1]
          commit('setDatasetId', datasetId)
          if (isBulk) return
          router.push({ name: 'CurateSpreadsheet', params: { datasetId } })
        } else {
          // Show error in snackbar and pass current function as callback
          commit(
            'setSnackbar',
            {
              message: error.message,
              action: () => {
                dispatch('createDatasetIdVuex', { isBulk })
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
    if (!chartObject) {
      return new Error('Caching error. Chart object is missing')
    }

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

  async createDatasetInstanceObject (_context, nanopubPayload) {
    const datasetObject =
      nanopubPayload?.['@graph']?.['np:hasAssertion']?.['@graph'][0]

    // Return if not able to retrieve chart object
    if (!datasetObject) {
      return new Error('Caching error. Dataset object is missing')
    }

    // Build chart instance object
    return {
      description:
        datasetObject['http://purl.org/dc/terms/description']?.[0]?.[
          '@value'
        ] ?? datasetObject['http://purl.org/dc/terms/description']?.['@value'],
      identifier: datasetObject['@id'],
      label:
        datasetObject['http://purl.org/dc/terms/title']?.[0]?.['@value'] ??
        datasetObject['http://purl.org/dc/terms/title']?.['@value'],
      thumbnail:
        datasetObject['http://xmlns.com/foaf/0.1/depiction']?.[
          'http://w3.org/ns/dcat#accessURL'
        ],
      doi: datasetObject['http://purl.org/dc/terms/isReferencedBy']?.['@value'],
      organization: datasetObject[
        'http://xmlns.com/foaf/0.1/Organization'
      ]?.map((org) => {
        return org?.['http://xmlns.com/foaf/0.1/name']?.['@value']
      }),
      distribution: datasetObject['http://w3.org/ns/dcat#distribution']?.map(
        (dist) => {
          return dist?.['@id']
        }
      )
    }
  },

  async deleteEntityNanopub (_context, entityUri) {
    // TODO: refactor delete function to generalize to other entity types
    const response = await deleteChart(entityUri)
    return response
  },

  async deleteEntityES ({ _, __, rootGetters }, payload) {
    const { identifier, type } = payload
    const url = '/api/admin/es'
    const token = rootGetters['auth/token']
    await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ doc: identifier, type: type })
    })
  },

  async cacheNewEntityResponse ({ commit, dispatch, rootGetters }, payload) {
    const { identifier, resourceNanopub, type } = payload

    const url = '/api/admin/es'
    let resourceInstanceObject
    if (type === 'charts') {
      resourceInstanceObject = await dispatch(
        'createChartInstanceObject',
        resourceNanopub
      )
    } else if (type === 'datasets') {
      resourceInstanceObject = await dispatch(
        'createDatasetInstanceObject',
        resourceNanopub
      )
    } else {
      return new Error('Caching error. Type parameter is missing or invalid')
    }

    const token = rootGetters['auth/token']

    // 1. Check if a chart with same identifier exist in ES and delete
    if (identifier) {
      await dispatch('deleteEntityES', { identifier, type })
    }

    const fetchResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ doc: resourceInstanceObject, type })
    })

    if (fetchResponse.status !== 200) {
      return new Error(
        fetchResponse.statusText || `Server error, cannot cache ${type} object`
      )
    }

    const response = await fetchResponse.json()
    return { response, identifier: resourceInstanceObject.identifier }
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
  async submitBulkXml ({ commit, dispatch, rootGetters }, files) {
    const token = rootGetters['auth/token']
    await dispatch('createDatasetIdVuex', { isBulk: true })
    const url = `${window.location.origin}/api/curate/bulk?dataset=${rootGetters['explorer/curation/datasetId']}`
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

  // Curation Form Page Submit Function
  async submitCurationData (
    { state, commit, rootGetters },
    { xlsxObjectId = null, isNew = true } = {}
  ) {
    const cId =
      state.curationFormData.Control_ID ??
      state.curationFormData.CONTROL_ID ??
      {}

    if (!cId?.cellValue && !xlsxObjectId) {
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
      ? `/api/curate?isBaseObject=true&dataset=${rootGetters['explorer/curation/datasetId']}`
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
  async createControlId ({ rootGetters, dispatch, commit }) {
    const url = '/api/curate/newsampleid'
    const token = rootGetters['auth/token']

    try {
      await dispatch('createDatasetIdVuex', { isBulk: true })

      const body = JSON.stringify({
        datasetId: rootGetters['explorer/curation/datasetId']
      })
      const request = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body,
        method: 'POST'
      })

      const { controlID } = await request.json()
      commit('setControlID', controlID)
    } catch (error) {
      commit(
        'setSnackbar',
        {
          message: error?.message ?? 'Something went wrong fetching Control_ID',
          action: () => this.setControlID()
        },
        { root: true }
      )
    }
  },
  async deleteCuration ({ commit, rootGetters, dispatch }, payload) {
    try {
      if (!payload || !payload?.xmlId) {
        throw new Error('Incorrect query parameters', {
          cause: 'Missing flag'
        })
      }
      const token = rootGetters['auth/token']
      const { xmlId, isNew } = payload

      await dispatch('deleteEntityNanopub', xmlId)

      const fetchResponse = await fetch(
        `/api/curate?xlsxObjectId=${xmlId}&isNew=${isNew}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          }
        }
      )

      if (fetchResponse.status !== 200) {
        throw new Error(
          fetchResponse.statusText || 'Server error, Unable to delete curation'
        )
      }
      const response = await fetchResponse.json()
      const snackbar = {
        message: response?.message ?? 'Delete Successful',
        duration: 5000
      }
      return commit('setSnackbar', snackbar, { root: true })
    } catch (error) {
      let snackbar
      if ('cause' in error) {
        snackbar = { message: error?.message, duration: 4000 }
      } else {
        snackbar = {
          message: error?.message ?? 'Something went wrong',
          action: () =>
            dispatch('deleteCuration', {
              xmlId: payload.xmlId,
              isNew: payload.isNew
            })
        }
      }
      commit('setSnackbar', snackbar, { root: true })
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
  },

  async approveCuration ({ commit, rootGetters }, { xmlViewer, callbackFn }) {
    const isAdmin = rootGetters['auth/isAdmin']
    const token = rootGetters['auth/token']
    if (!isAdmin) {
      return commit(
        'setSnackbar',
        {
          message: 'This action is only available to administrator',
          duration: 7000
        },
        { root: true }
      )
    }
    commit(
      'setSnackbar',
      {
        message: 'Submitting your curation...',
        duration: 2000
      },
      { root: true }
    )
    try {
      await saveXml(xmlViewer, token)
      // TODO: FIX THIS LATER!
      // commit('resetSnackbar', {}, { root: true });
      commit('setDialogBox', true, { root: true })
      return callbackFn()
    } catch (error) {
      commit(
        'setSnackbar',
        {
          message: 'An error occurred during submission',
          duration: 7000
        },
        { root: true }
      )
    }
  },

  async requestApproval (
    { commit, rootGetters, dispatch },
    { curationId, isNew }
  ) {
    const isAdmin = rootGetters['auth/isAdmin']
    const token = rootGetters['auth/token']
    if (isAdmin) {
      return commit(
        'setSnackbar',
        {
          message: 'This action is only available to non administrator',
          duration: 7000
        },
        { root: true }
      )
    }
    try {
      const response = await fetch('/api/curate/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ curationId, isNew })
      })
      if (!response || response.status !== 200) {
        return commit(
          'setSnackbar',
          {
            message: 'Something went wrong during the request',
            action: () => dispatch('requestApproval', { curationId, isNew })
          },
          { root: true }
        )
      }
      return commit(
        'setSnackbar',
        {
          message: 'Approval request is successful',
          duration: 7000
        },
        { root: true }
      )
    } catch (error) {
      return commit(
        'setSnackbar',
        {
          message: 'Something went wrong during the request',
          action: () => dispatch('requestApproval', { curationId, isNew })
        },
        { root: true }
      )
    }
  },
  async submitXmlFiles ({ commit, rootGetters }, files) {
    const token = rootGetters['auth/token']
    try {
      const formData = new FormData()
      files.forEach(({ file }) => formData.append('uploadfile', file))

      const response = await fetch('/api/curate/xml', {
        method: 'POST',
        headers: {
          // 'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: formData
      })

      if (response || response.status === 201) {
        const { totalXMLFiles, failedXML } = await response.json()
        if (failedXML === 0) {
          commit(
            'setSnackbar',
            {
              message: 'Your XML has been successfully submitted.',
              duration: 10000
            },
            { root: true }
          )
          return router.push('/explorer/xmls')
        } else {
          return commit(
            'setSnackbar',
            {
              message: `Submission failed for ${failedXML} out of ${totalXMLFiles} entries`,
              callToActionText: 'Click to view',
              action: () => router.push('/explorer/xmls')
            },
            { root: true }
          )
        }
      }
    } catch (error) {
      return commit(
        'setSnackbar',
        { message: error.message ?? 'Something went wrong during the request' },
        { root: true }
      )
    }
  }
}
