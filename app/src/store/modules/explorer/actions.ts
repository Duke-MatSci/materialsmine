import { querySparql, parseSparql } from '@/modules/sparql';
import queries from '@/modules/queries/sampleQueries';
import router from '@/router';
import { ActionContext } from 'vuex';
import { ExplorerState } from './types';

type Context = ActionContext<ExplorerState, any>;

export default {
  // Todo: (@FE) This function should be deprecated.
  async facetFilterMaterials(context: Context): Promise<void> {
    // const sparqlResponse = await querySparql(queries.facetFilterMaterial())
    // const parsedResponse = parseSparql(sparqlResponse)
    // context.commit('setFacetFilterMaterials', parsedResponse || [])
    const response = await fetch('/api/admin/populate-datasets-properties', {
      method: 'GET',
    });

    if (!response || response.statusText !== 'OK') {
      const error = new Error(response?.statusText || 'Something went wrong!');
      throw error;
    }

    if (response.status === 200) {
      const responseData = await response.json();
      context.commit('setFacetFilterMaterials', responseData?.data || []);
    }
  },
  async searchFacetFilterMaterials(context: Context, payload: string): Promise<void> {
    if (!payload) {
      return;
    }

    context.commit('setSelectedFacetFilterMaterialsValue', payload);
    router.push(`/explorer/filter/property/${payload}`);
    const getCount = await querySparql(
      queries.getSearchFacetFilterMaterialCount(payload.split(' ').join(''))
    );
    const getDefinition = await querySparql(
      queries.getSearchFacetFilterMaterialDefinition(payload.split(' ').join(''))
    );
    const getContent = await querySparql(
      queries.getSearchFacetFilterMaterial(payload.split(' ').join(''))
    );

    const parsedResponseCount = parseSparql(getCount);
    const parsedResponseDefinition = parseSparql(getDefinition);
    const parsedResponseContent = parseSparql(getContent);

    context.commit('setSelectedFacetFilterMaterials', {
      parsedResponseCount,
      parsedResponseDefinition,
      parsedResponseContent,
    });
  },
  async fetchSingleDataset(context: Context, uri: string): Promise<any> {
    if (!uri) {
      return;
    }

    let datasets = context.rootGetters['explorer/sddDatasets/getAllDatasets'];

    if (datasets.length < 9) {
      await context.dispatch('explorer/sddDatasets/loadDatasets', {}, { root: true });
      datasets = context.rootGetters['explorer/sddDatasets/getAllDatasets'];
    }

    const dataset = datasets.find((item: any) => item.identifier === uri);
    context.commit('setCurrentDataset', dataset);
    return dataset;
  },
  async fetchDatasetThumbnail(context: Context, uri: string): Promise<string | undefined> {
    if (!uri) {
      return undefined;
    }
    // const response = await fetch(`/api/knowledge/instance?uri=${uri}`, {
    //   method: 'GET',
    // });

    // if (response?.statusText !== 'OK') {
    //   const snackbar = {
    //     message: response.statusText || 'Something went wrong while fetching thumbnail',
    //     duration: 5000,
    //   };
    //   context.commit('setSnackbar', snackbar, { root: true });
    //   return undefined;
    // }

    // const responseData = await response.json();
    // let accessURL: string | undefined;
    // if (Array.isArray(responseData)) {
    //   accessURL = responseData[0]['http://www.w3.org/ns/dcat#accessURL'];
    //   // Note: Initial sets of SDD curations are missing 'www'
    //   if (!accessURL) {
    //     accessURL = responseData[0]['http://w3.org/ns/dcat#accessURL'];
    //   }
    // } else {
    //   accessURL = responseData['http://www.w3.org/ns/dcat#accessURL'];
    //   // Note: Initial sets of SDD curations are missing 'www'
    //   if (!accessURL) {
    //     accessURL = responseData['http://w3.org/ns/dcat#accessURL'];
    //   }
    // }
    // context.commit('setCurrentDatasetThumbnail', accessURL);
    // return accessURL;
    context.commit('setCurrentDatasetThumbnail', uri);
    return uri;
  },
  async fetchViscoelasticData(
    { commit, dispatch }: Context,
    { base64 = '' }: { base64?: string }
  ): Promise<void> {
    if (!base64) return;

    const uri = '/api/_dash-update-component';
    const body = JSON.stringify({
      output:
        '..upload-table.data...upload-alert.children...upload-alert.color...upload-alert.is_open..',
      outputs: [
        { id: 'upload-table', property: 'data' },
        { id: 'upload-alert', property: 'children' },
        { id: 'upload-alert', property: 'color' },
        { id: 'upload-alert', property: 'is_open' },
      ],
      inputs: [{ id: 'upload-data', property: 'contents', value: base64 }],
      changedPropIds: ['upload-data.contents'],
    });
    try {
      const request = await fetch(uri, {
        headers: { accept: 'application/json' },
        body,
        method: 'POST',
      });
      const response = await request.json();

      if (!response || response.status !== 200) {
        const error = new Error(response?.message || 'Something went wrong!');
        throw error;
      }
      commit('setSnackbar', { message: 'Successful Upload', duration: 3000 }, { root: true });
    } catch (err: any) {
      commit(
        'setSnackbar',
        {
          message: err.message,
          action: () => dispatch('fetchViscoelasticData', { base64 }),
        },
        { root: true }
      );
    }
  },
  async fetchDynamfitData({ commit, dispatch, rootGetters }: Context, payload: any): Promise<void> {
    if (!payload.file_name) return;

    const url = '/api/mn/dynamfit';
    const token = rootGetters['auth/token'];
    try {
      const req = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ ...payload }),
        method: 'POST',
      });

      const response = (await req?.json()) ?? null;
      if (!response || req.status !== 200) {
        const statusCode = req?.status;
        const message = statusCode === 500 ? 'Internal Server Error' : response?.message;
        const error: any = new Error(message ?? 'Something went wrong!');
        error.cause = statusCode;
        throw error;
      }

      const data = response?.response ?? {};
      const breach = response?.error ?? null;
      if (breach) {
        const { givenName, surName } = rootGetters['auth/user'];
        const data = {
          fullName: `${givenName} ${surName}`,
          email: response?.systemEmail,
          purpose: 'TICKET',
          message: `Code: ${breach?.code} ${breach?.description}`,
        };
        dispatch('contact/contactUs', data, { root: true });
      }
      commit('setDynamfitData', data);
    } catch (err: any) {
      const snackbar: any = { message: err.message };
      if (err?.cause === 400) {
        snackbar.duration = 3000;
      } else {
        snackbar.action = () => dispatch('fetchDynamfitData', payload);
      }
      commit('setSnackbar', snackbar, { root: true });
    }
  },

  async duplicateXml(
    { commit, rootGetters }: Context,
    payload: { id: string; isNew: boolean }
  ): Promise<{ id: string; isNew: boolean } | undefined> {
    const uri = `/api/curate/duplicate/${payload.id}?isNew=${payload.isNew}`;
    const token = rootGetters['auth/token'];
    try {
      const request = await fetch(uri, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
      });
      const response = await request.json();
      if (!response || !response._id) {
        const error = new Error('Something went wrong!');
        throw error;
      }
      return { id: response._id, isNew: response.isNew };
    } catch (err: any) {
      commit(
        'setSnackbar',
        {
          message: err.message,
        },
        { root: true }
      );
    }
  },
};
