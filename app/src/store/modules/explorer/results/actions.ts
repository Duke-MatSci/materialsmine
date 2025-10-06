import { ActionContext } from 'vuex';
import {
  ResultsState,
  OutboundSearchPayload,
  SearchResponseData,
  TotalGrouping,
  ImageResult,
} from '../types';

type Context = ActionContext<ResultsState, unknown>;

export default {
  async searchKeyword(
    { commit, dispatch }: Context,
    payload: string
  ): Promise<void> {
    commit('setIsLoading', true);
    const newPayload: OutboundSearchPayload = {
      keyPhrase: payload,
      type: 'search',
    };
    if (!payload) {
      return;
    }
    await dispatch('outboundSearchRequest', newPayload);
    await dispatch('getMatchedImages', payload);
    return dispatch('getMatchedMaterials', payload);
  },

  async getMatchedImages(
    { commit, getters, dispatch }: Context,
    payload: string
  ): Promise<void> {
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
        input: { search: 'Keyword', searchValue: payload, pageSize: 100 },
      },
      fetchPolicy: 'cache-first',
    });
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: graphql,
    };
    try {
      const response = await fetch(url, requestOptions);
      if (!response || response?.statusText !== 'OK') {
        const error = new Error(response.statusText || 'Something went wrong!');
        throw error;
      }

      const responseData: SearchResponseData = await response.json();
      const total =
        getters.getTotal + (responseData?.data?.searchImages?.totalItems ?? 0);
      const groupTotals: TotalGrouping = getters.getTotalGroupings;
      groupTotals.getImages = responseData?.data?.searchImages?.totalItems ?? 0;
      commit('setTotal', total ?? 0);
      commit(
        'setImages',
        (responseData?.data?.searchImages?.images ?? []) as ImageResult[]
      );
      commit('setTotalGrouping', groupTotals);
    } catch (error) {
      const snackbar = {
        message: 'Something went wrong while fetching images!',
        action: () => dispatch('getMatchedImages', payload),
      };
      return commit('setSnackbar', snackbar, { root: true });
    }
  },

  async getMatchedMaterials(
    { commit, getters, dispatch }: Context,
    payload: string
  ): Promise<void> {
    const url = `/api/admin/populate-datasets-properties?search=${payload}`;
    try {
      const cache = await dispatch('fetchWrapper', { url }, { root: true }).then(
        (res: { val: RequestCache }) => res.val
      );
      const response = await fetch(url, {
        method: 'GET',
        cache,
      });

      if (!response || response.statusText !== 'OK') {
        const error = new Error(response?.statusText || 'Something went wrong!', {
          cause: url,
        });
        throw error;
      }

      const responseData: { data?: unknown[] } = await response.json();
      const materialsTotal = responseData?.data?.length || 0;

      const total = getters.getTotal + materialsTotal;
      const groupTotals: TotalGrouping = getters.getTotalGroupings;
      groupTotals.getMaterials = materialsTotal;

      commit('setTotal', total || 0);
      commit('setMaterials', responseData?.data || []);
      commit('setTotalGrouping', groupTotals);
    } catch (error) {
      await dispatch(
        'fetchWrapper',
        { url: 'cause' in (error as Error) },
        { root: true }
      );
      const snackbar = {
        message: 'Something went wrong while fetching properties!',
        action: () => dispatch('getMatchedMaterials', payload),
      };
      return commit('setSnackbar', snackbar, { root: true });
    }
  },

  async outboundSearchRequest(
    { commit, dispatch }: Context,
    payload: OutboundSearchPayload
  ): Promise<void> {
    const { keyPhrase, type } = payload;
    let url: string;
    if (type === 'search') {
      url = `/api/search?search=${keyPhrase}`;
    } else {
      url = `/api/search/autosuggest?search=${keyPhrase}`;
    }

    try {
      const cache = await dispatch('fetchWrapper', { url }, { root: true }).then(
        (res: { val: RequestCache }) => res.val
      );
      const response = await fetch(url, {
        method: 'GET',
        cache,
      });

      if (!response || response.statusText !== 'OK') {
        commit('setIsLoading', false);
        const error = new Error(response?.statusText || 'Something went wrong!');
        throw error;
      }

      if (response.status === 201) {
        return;
      }

      const responseData: SearchResponseData = await response.json();
      if (type === 'search') {
        return dispatch('saveSearch', responseData);
      } else {
        return dispatch('saveAutosuggest', responseData);
      }
    } catch (error) {
      const snackbar = {
        message: 'Something went wrong!',
        action: () => dispatch('outboundSearchRequest', payload),
      };
      return commit('setSnackbar', snackbar, { root: true });
    }
  },

  async autosuggestionRequest(
    { dispatch }: Context,
    payload: string
  ): Promise<void> {
    const newPayload: OutboundSearchPayload = {
      keyPhrase: payload,
      type: 'autosuggest',
    };

    if (!payload) {
      return;
    }
    return dispatch('outboundSearchRequest', newPayload);
  },

  saveSearch({ commit }: Context, responseData: SearchResponseData): void {
    const data = responseData?.data?.hits || [];
    const types: Record<string, unknown[]> = Object.create({});
    data.forEach((item) => {
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

    commit('setArticles', types?.articles || []);
    commit('setSamples', types?.samples || []);
    commit('setCharts', types?.charts || []);
    commit('setTotal', total || 0);
    commit('setIsLoading', false);
    commit('setTotalGrouping', {
      getArticles: articlesLength,
      getSamples: samplesLength,
      getCharts: chartsLength,
      getMaterials: 0,
      getImages: 0,
    });
  },

  saveAutosuggest(
    { commit }: Context,
    responseData: SearchResponseData
  ): void {
    const data = responseData?.data?.hits || [];
    const suggestions = data.map((item) => {
      return (item?._source as { label?: string })?.label;
    });
    commit('setAutosuggest', (suggestions || []) as string[]);
  },
};
