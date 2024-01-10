import { querySparql, parseSparql } from '@/modules/sparql'
import queries from '@/modules/queries/sampleQueries'
import router from '@/router'
export default {
  // Todo: (@FE) This function should be deprecated.
  async facetFilterMaterials (context) {
    // const sparqlResponse = await querySparql(queries.facetFilterMaterial())
    // const parsedResponse = parseSparql(sparqlResponse)
    // context.commit('setFacetFilterMaterials', parsedResponse || [])
    const response = await fetch('/api/admin/populate-datasets-properties', {
      method: 'GET'
    })

    if (!response || response.statusText !== 'OK') {
      const error = new Error(response?.message || 'Something went wrong!')
      throw error
    }

    if (response.status === 200) {
      const responseData = await response.json()
      context.commit('setFacetFilterMaterials', responseData?.data || [])
    }
  },
  async searchFacetFilterMaterials (context, payload) {
    if (!payload) {
      return
    }

    context.commit('setSelectedFacetFilterMaterialsValue', payload)
    router.push(`/explorer/filter/property/${payload}`)
    const getCount = await querySparql(
      queries.getSearchFacetFilterMaterialCount(payload.split(' ').join(''))
    )
    const getDefinition = await querySparql(
      queries.getSearchFacetFilterMaterialDefinition(
        payload.split(' ').join('')
      )
    )
    const getContent = await querySparql(
      queries.getSearchFacetFilterMaterial(payload.split(' ').join(''))
    )

    const parsedResponseCount = parseSparql(getCount)
    const parsedResponseDefinition = parseSparql(getDefinition)
    const parsedResponseContent = parseSparql(getContent)

    context.commit('setSelectedFacetFilterMaterials', {
      parsedResponseCount,
      parsedResponseDefinition,
      parsedResponseContent
    })
  },
  async fetchSingleDataset (context, uri) {
    if (!uri) {
      return
    }
    const response = await fetch(`/api/knowledge/instance?uri=${uri}`, {
      method: 'GET'
    })

    if (response?.statusText !== 'OK') {
      const error = new Error(
        response?.message || 'Something went wrong while fetching dataset'
      )
      throw error
    }

    let responseData = await response.json()
    if (Array.isArray(responseData)) responseData = responseData[0]
    context.commit('setCurrentDataset', responseData)
    return responseData
  },
  async fetchDatasetThumbnail (context, uri) {
    if (!uri) {
      return
    }
    const response = await fetch(`/api/knowledge/instance?uri=${uri}`, {
      method: 'GET'
    })

    if (response?.statusText !== 'OK') {
      const snackbar = {
        message:
          response.message || 'Something went wrong while fetching thumbnail',
        duration: 5000
      }
      return context.commit('setSnackbar', snackbar, { root: true })
    }

    const responseData = await response.json()
    let accessURL
    if (Array.isArray(responseData)) { accessURL = responseData[0]['http://w3.org/ns/dcat#accessURL'] } else accessURL = responseData['http://w3.org/ns/dcat#accessURL']
    context.commit('setCurrentDatasetThumbnail', accessURL)
    return accessURL
  },
  async fetchViscoelasticData ({ commit, dispatch }, { base64 = '' }) {
    if (!base64) return

    const uri = '/api/_dash-update-component'
    const body = JSON.stringify({
      output:
        '..upload-table.data...upload-alert.children...upload-alert.color...upload-alert.is_open..',
      outputs: [
        { id: 'upload-table', property: 'data' },
        { id: 'upload-alert', property: 'children' },
        { id: 'upload-alert', property: 'color' },
        { id: 'upload-alert', property: 'is_open' }
      ],
      inputs: [{ id: 'upload-data', property: 'contents', value: base64 }],
      changedPropIds: ['upload-data.contents']
    })
    try {
      const request = await fetch(uri, {
        headers: { accept: 'application/json' },
        body,
        method: 'POST'
      })
      const response = await request.json()

      if (!response || response.status !== 200) {
        const error = new Error(response?.message || 'Something went wrong!')
        throw error
      }
      commit(
        'setSnackbar',
        { message: 'Successful Upload', duration: 3000 },
        { root: true }
      )
    } catch (err) {
      commit(
        'setSnackbar',
        {
          message: err.message,
          action: () => dispatch('fetchViscoelasticData', { base64 })
        },
        { root: true }
      )
    }
  },
  async fetchDynamfitData ({ commit, dispatch, rootGetters }, payload) {
    if (!payload.fileName) return
    const body = JSON.stringify({
      file_name: payload.fileName,
      number_of_prony: payload?.numberOfProny,
      model: payload?.model,
      fit_settings: payload?.fitSettings
    })
    const url = '/api/mn/dynamfit'
    const token = rootGetters['auth/token']
    try {
      const req = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body,
        method: 'POST'
      })

      const response = (await req?.json()) ?? null
      if (!response || req.status !== 200) {
        const message =
          req?.status === 500 ? 'Internal Server Error' : response?.message
        const error = new Error(message ?? 'Something went wrong!')
        throw error
      }

      const data = response?.response ?? {}
      const breach = response?.error ?? null
      if (breach) {
        const { givenName, surName } = rootGetters['auth/user']
        const data = {
          fullName: `${givenName} ${surName}`,
          email: response?.systemEmail,
          purpose: 'TICKET',
          message: `Code: ${breach?.code} ${breach?.description}`
        }
        dispatch('contact/contactUs', data, { root: true })
      }
      commit('setDynamfitData', data)
    } catch (err) {
      commit(
        'setSnackbar',
        {
          message: err.message,
          action: () => dispatch('fetchDynamfitData', payload)
        },
        { root: true }
      )
    }
  }
}
