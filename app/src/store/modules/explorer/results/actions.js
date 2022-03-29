export default {
  async searchKeyword (context, payload) {
    context.commit('setIsLoading', true);
    const newPayload = {
      keyPhrase: payload,
      type: 'search'
    }
    if (!payload ) {
      return;
    }
    return context.dispatch('outboundSearchRequest', newPayload);
  },

  async outboundSearchRequest (context, payload) {
    const { keyPhrase, type } = payload;
    let url;
    if(type === 'search') {
      url = `http://localhost:80/api/search?search=${keyPhrase}`;
    } else {
      url = `http://localhost:80/api/search/autosuggest?search=${keyPhrase}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
    })

    if (!response || response.statusText !== "OK") {
      const error = new Error(
        responseData.message || 'Something went wrong!'
      )
      throw error;
    }

    if(response.status === 201) {
      return;
    }

    const responseData = await response.json();
    if(type === 'search') {
      return context.dispatch('saveSearch', responseData);
    } else {
      return context.dispatch('saveAutosuggest', responseData);
    }
  },

  async autosuggestionRequest (context, payload) {
    const newPayload = {
      keyPhrase: payload,
      type: 'autosuggest'
    }

    if(!payload ){
      return;
    }
    return context.dispatch('outboundSearchRequest', newPayload);
  },

  saveSearch (context, responseData) {
    const data = responseData?.data?.hits || [];
    const types = Object.create({});
    data.forEach((item) => {
      let categoryExist = Object.keys(types);

      categoryExist = categoryExist.length ? Object.keys(types).find(currKey => currKey === item?._index) : undefined;

      if (categoryExist) {
        types[categoryExist].push(item?._source);
      } else {
        types[item._index] = new Array(item?._source);
      }
    });
    context.commit('setArticles', types?.articles || []);
    context.commit('setSamples', types?.samples || []);
    context.commit('setImages', types?.images || []);
    context.commit('setCharts', types?.charts || []);
    context.commit('setTotal', responseData?.data?.total?.value || 0);
    context.commit('setIsLoading', false);
    context.commit('setTotalGrouping', {
      getArticles: types?.articles?.length || 0,
      getSamples: types?.samples?.length || 0,
      getImages: types?.images?.length || 0,
      getCharts: types?.charts?.length || 0,
      getMaterials: 0,
    })
  },

  saveAutosuggest (context, responseData) {
    const data = responseData?.data?.hits || [];
    const suggestions = data.map(item => {
      return item._source.label
    });
    context.commit('setAutosuggest', suggestions || []);
  }
}
