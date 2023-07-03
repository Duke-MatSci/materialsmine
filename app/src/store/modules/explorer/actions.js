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
      const error = new Error(
        response?.message || 'Something went wrong!'
      )
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
    const getCount = await querySparql(queries.getSearchFacetFilterMaterialCount(payload.split(' ').join('')))
    const getDefinition = await querySparql(queries.getSearchFacetFilterMaterialDefinition(payload.split(' ').join('')))
    const getContent = await querySparql(queries.getSearchFacetFilterMaterial(payload.split(' ').join('')))

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
    const response = await fetch(`/api/knowledge/images?uri=${uri}`, {
      method: 'GET'
    })

    if (response?.statusText !== 'OK') {
      const snackbar = {
        message: response.message || 'Something went wrong while fetching dataset',
        duration: 5000
      }
      return context.commit('setSnackbar', snackbar, { root: true })
    }

    const responseData = await response.json()
    if (Array.isArray(responseData)) return context.commit('setCurrentDataset', responseData[0])
    return context.commit('setCurrentDataset', responseData)
  },
  async fetchDatasetThumbnail (context, uri) {
    if (!uri) {
      return
    }
    const response = await fetch(`/api/knowledge/images?uri=${uri}`, {
      method: 'GET'
    })

    if (response?.statusText !== 'OK') {
      const snackbar = {
        message: response.message || 'Something went wrong while fetching thumbnail',
        duration: 5000
      }
      return context.commit('setSnackbar', snackbar, { root: true })
    }

    const responseData = await response.json()
    if (Array.isArray(responseData)) return context.commit('setCurrentDatasetThumbnail', responseData[0]['http://w3.org/ns/dcat#accessURL'])
    return context.commit('setCurrentDatasetThumbnail', responseData['http://w3.org/ns/dcat#accessURL'])
  }
}
