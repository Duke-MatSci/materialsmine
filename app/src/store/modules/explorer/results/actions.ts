import { ActionContext } from 'vuex';
import { ResultsState } from './types';

type Context = ActionContext<ResultsState, any>;

export default {
  async searchKeyword(context: Context, payload: string): Promise<void> {
    context.commit('setIsLoading', true);
    const newPayload = {
      keyPhrase: payload,
      type: 'search'
    };
    if (!payload) {
      return;
    }
    await context.dispatch('outboundSearchRequest', newPayload);
    await context.dispatch('getMatchedImages', payload);
    return context.dispatch('getMatchedMaterials', payload);
  },

  async getMatchedImages(context: Context, payload: string): Promise<void> {
    const url = `${window.location.origin}/api/graphql`;
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
      variables: {
        input: { search: 'Keyword', searchValue: payload, pageSize: 100 }
      },
      fetchPolicy: 'cache-first'
    });
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: graphql
    };
    try {
      const response = await fetch(url, requestOptions);
      if (!response || response?.statusText !== 'OK') {
        const error = new Error(response.statusText || 'Something went wrong!');
        throw error;
      }

      const responseData = await response.json();
      const total =
        context.getters.getTotal + responseData?.data?.searchImages?.totalItems;
      const groupTotals = context.getters.getTotalGroupings;
      groupTotals.getImages = responseData?.data?.searchImages?.totalItems ?? 0;
      context.commit('setTotal', total ?? 0);
      context.commit(
        'setImages',
        responseData?.data?.searchImages?.images ?? []
      );
      context.commit('setTotalGrouping', groupTotals);
    } catch (error) {
      const snackbar = {
        message: 'Something went wrong while fetching images!',
        action: () => context.dispatch('getMatchedImages', payload)
      };
      return context.commit('setSnackbar', snackbar, { root: true });
    }
  },

  async getMatchedMaterials(context: Context, payload: string): Promise<void> {
    const url = `/api/admin/populate-datasets-properties?search=${payload}`;
    try {
      const cache = await context
        .dispatch('fetchWrapper', { url }, { root: true })
        .then((res: any) => res.val);
      const response = await fetch(url, {
        method: 'GET',
        cache
      });

      if (!response || response.statusText !== 'OK') {
        const error: any = new Error(response?.statusText || 'Something went wrong!');
        error.cause = url;
        throw error;
      }

      const responseData = await response.json();
      const materialsTotal = responseData?.data?.length || 0;

      const total = context.getters.getTotal + materialsTotal;
      const groupTotals = context.getters.getTotalGroupings;
      groupTotals.getMaterials = materialsTotal;

      context.commit('setTotal', total || 0);
      context.commit('setMaterials', responseData?.data || []);
      context.commit('setTotalGrouping', groupTotals);
    } catch (error: any) {
      await context.dispatch(
        'fetchWrapper',
        { url: 'cause' in error },
        { root: true }
      );
      const snackbar = {
        message: 'Something went wrong while fetching properties!',
        action: () => context.dispatch('getMatchedMaterials', payload)
      };
      return context.commit('setSnackbar', snackbar, { root: true });
    }
  },

  async outboundSearchRequest(context: Context, payload: { keyPhrase: string; type: string }): Promise<void> {
    const { keyPhrase, type } = payload;
    let url: string;
    if (type === 'search') {
      url = `/api/search?search=${keyPhrase}`;
    } else {
      url = `/api/search/autosuggest?search=${keyPhrase}`;
    }

    try {
      const cache = await context
        .dispatch('fetchWrapper', { url }, { root: true })
        .then((res: any) => res.val);
      const response = await fetch(url, {
        method: 'GET',
        cache
      });

      if (!response || response.statusText !== 'OK') {
        context.commit('setIsLoading', false);
        const error = new Error(response?.statusText || 'Something went wrong!');
        throw error;
      }

      if (response.status === 201) {
        return;
      }

      const responseData = await response.json();
      if (type === 'search') {
        return context.dispatch('saveSearch', responseData);
      } else {
        return context.dispatch('saveAutosuggest', responseData);
      }
    } catch (error) {
      const snackbar = {
        message: 'Something went wrong!',
        action: () => context.dispatch('outboundSearchRequest', payload)
      };
      return context.commit('setSnackbar', snackbar, { root: true });
    }
  },

  async autosuggestionRequest(context: Context, payload: string): Promise<void> {
    const newPayload = {
      keyPhrase: payload,
      type: 'autosuggest'
    };

    if (!payload) {
      return;
    }
    return context.dispatch('outboundSearchRequest', newPayload);
  },

  saveSearch(context: Context, responseData: any): void {
    const data = responseData?.data?.hits || [];
    const types: Record<string, any[]> = Object.create({});
    data.forEach((item: any) => {
      const categoryExist =
        Object.keys(types)?.find((currKey) => currKey === item?._index) ||
        undefined;

      if (categoryExist) {
        types[categoryExist].push(item._source);
      } else {
        types[item._index] = new Array(item._source);
      }
    });
    const articlesLength = types?.articles?.length || 0;
    const samplesLength = types?.samples?.length || 0;
    const chartsLength = types?.charts?.length || 0;
    const total = [articlesLength, samplesLength, chartsLength].reduce(
      (total, value) => total + value
    );

    context.commit('setArticles', types?.articles || []);
    context.commit('setSamples', types?.samples || []);
    context.commit('setCharts', types?.charts || []);
    context.commit('setTotal', total || 0);
    context.commit('setIsLoading', false);
    context.commit('setTotalGrouping', {
      getArticles: articlesLength,
      getSamples: samplesLength,
      getCharts: chartsLength,
      getMaterials: 0,
      getImages: 0
    });
  },

  saveAutosuggest(context: Context, responseData: any): void {
    const data = responseData?.data?.hits || [];
    const suggestions = data.map((item: any) => {
      return item?._source?.label;
    });
    context.commit('setAutosuggest', suggestions || []);
  }
};
