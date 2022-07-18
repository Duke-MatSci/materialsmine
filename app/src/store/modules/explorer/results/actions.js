export default {
  async searchKeyword (context, payload) {
    context.commit('setIsLoading', true)
    const newPayload = {
      keyPhrase: payload,
      type: 'search'
    }
    if (!payload) {
      return
    }
    await context.dispatch('outboundSearchRequest', newPayload)
    return context.dispatch('getMatchedImages', payload)
  },

  async getMatchedImages (context, payload) {
    const url = `${window.location.origin}/api/graphql`
    const graphql = JSON.stringify({
      query: `query SearchImages($input: imageExplorerInput!){
        searchImages(input: $input) {
          totalItems
          pageSize
          pageNumber
          totalPages
          hasPreviousPage
          hasNextPage
          images {
            file
            description
            type
            metaData{
              title
              id
            }
          }
        }
      }`,
      variables: { input: { search: 'filterByKeyword', searchValue: payload, pageSize: 100 } }
    })
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: graphql
    }
    const response = await fetch(url, requestOptions)
    if (!response || response?.statusText !== 'OK') {
      const error = new Error(
        response.message || 'Something went wrong!'
      )
      throw error
    }

    const responseData = await response.json()
    const total = context.getters.getTotal + responseData?.data?.searchImages?.totalItems
    const groupTotals = context.getters.getTotalGroupings
    groupTotals.getImages = responseData?.data?.searchImages?.totalItems
    context.commit('setTotal', total || 0)
    context.commit('setImages', responseData?.data?.searchImages?.images || [])
    context.commit('setTotalGrouping', groupTotals)
  },

  async outboundSearchRequest (context, payload) {
    const { keyPhrase, type } = payload
    let url
    if (type === 'search') {
      url = `/api/search?search=${keyPhrase}`
    } else {
      url = `/api/search/autosuggest?search=${keyPhrase}`
    }

    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response || response.statusText !== 'OK') {
      context.commit('setIsLoading', false)
      const error = new Error(
        response?.message || 'Something went wrong!'
      )
      throw error
    }

    if (response.status === 201) {
      return
    }

    const responseData = await response.json()
    if (type === 'search') {
      return context.dispatch('saveSearch', responseData)
    } else {
      return context.dispatch('saveAutosuggest', responseData)
    }
  },

  async autosuggestionRequest (context, payload) {
    const newPayload = {
      keyPhrase: payload,
      type: 'autosuggest'
    }

    if (!payload) {
      return
    }
    return context.dispatch('outboundSearchRequest', newPayload)
  },

  saveSearch (context, responseData) {
    const data = responseData?.data?.hits || []
    const types = Object.create({})
    data.forEach((item) => {
      const categoryExist = Object.keys(types)?.find(currKey => currKey === item?._index) || undefined

      if (categoryExist) {
        types[categoryExist].push(item._source)
      } else {
        types[item._index] = new Array(item._source)
      }
    })
    context.commit('setArticles', types?.articles || [])
    context.commit('setSamples', types?.samples || [])
    context.commit('setCharts', types?.charts || [])
    context.commit('setTotal', responseData?.data?.total?.value || 0)
    context.commit('setIsLoading', false)
    context.commit('setTotalGrouping', {
      getArticles: types?.articles?.length || 0,
      getSamples: types?.samples?.length || 0,
      getImages: types?.images?.length || 0,
      getCharts: types?.charts?.length || 0,
      getMaterials: 0
    })
  },

  saveAutosuggest (context, responseData) {
    const data = responseData?.data?.hits || []
    const suggestions = data.map(item => {
      return item?._source?.label
    })
    context.commit('setAutosuggest', suggestions || [])
  }
}
