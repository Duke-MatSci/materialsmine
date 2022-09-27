import { querySparql, parseSparql } from '@/modules/sparql'
import queries from '@/modules/queries/sampleQueries'
import router from '@/router'
export default {
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
      return context.commit('setFacetFilterMaterials', responseData?.data || [])
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
  }
}
