import { CREATE_DATASET_ID_MUTATION } from '@/modules/gql/dataset-gql';
import { SEARCH_SPREADSHEETLIST_QUERY } from '@/modules/gql/metamaterial-gql';
import router from '@/router';
import apollo from '@/modules/gql/apolloClient';
import { deleteChart, saveXml } from '@/modules/vega-chart';
import { isValidOrcid } from '@/modules/whyis-dataset';
import { ActionContext } from 'vuex';
import {
  CurationState,
  CreateDatasetIdPayload,
  DeleteEntityPayload,
  CacheEntityPayload,
  FetchXlsListPayload,
  FetchCurationDataPayload,
  SubmitCurationDataPayload,
  DeleteCurationPayload,
  SearchRorPayload,
  ApproveCurationPayload,
  RequestApprovalPayload,
  DeleteEntityFilesPayload,
} from '../types';

type Context = ActionContext<CurationState, unknown>;

export default {
  async createDatasetIdVuex(
    { commit, dispatch }: Context,
    { isBulk = false }: CreateDatasetIdPayload
  ): Promise<void> {
    await apollo
      .mutate({
        mutation: CREATE_DATASET_ID_MUTATION,
      })
      .then((result) => {
        const datasetId = result.data.createDatasetId.datasetGroupId;
        commit('setDatasetId', datasetId);
        if (isBulk) return;
        router.push({ name: 'CurateSpreadsheet', params: { datasetId } });
      })
      .catch((error: Error) => {
        if (error.message.includes('unused datasetId')) {
          const datasetId = error.message.split('-')[1]?.split(' ')[1];
          commit('setDatasetId', datasetId);
          if (isBulk) return;
          router.push({ name: 'CurateSpreadsheet', params: { datasetId } });
        } else {
          // Show error in snackbar and pass current function as callback
          commit(
            'setSnackbar',
            {
              message: error.message,
              action: () => {
                dispatch('createDatasetIdVuex', { isBulk });
              },
            },
            { root: true }
          );
        }
      });
  },

  async createChartInstanceObject(
    _context: Context,
    nanopubPayload: unknown
  ): Promise<Record<string, unknown> | Error> {
    const payload = nanopubPayload as Record<string, unknown>;
    const graph = payload?.['@graph'] as Record<string, unknown>;
    const assertion = graph?.['np:hasAssertion'] as Record<string, unknown[]>;
    const chartObject = assertion?.['@graph']?.[0] as Record<string, unknown>;

    // Return if not able to retrieve chart object
    if (!chartObject) {
      return new Error('Caching error. Chart object is missing');
    }

    // Build chart instance object
    return {
      description: ((chartObject['http://purl.org/dc/terms/description'] as unknown[])?.[0] as Record<string, unknown>)?.['@value'],
      identifier: chartObject['@id'],
      label: ((chartObject['http://purl.org/dc/terms/title'] as unknown[])?.[0] as Record<string, unknown>)?.['@value'],
      thumbnail: (chartObject['http://xmlns.com/foaf/0.1/depiction'] as Record<string, unknown>)?.['@id'],
    };
  },

  async createDatasetInstanceObject(
    _context: Context,
    nanopubPayload: unknown
  ): Promise<Record<string, unknown> | Error> {
    const payload = nanopubPayload as Record<string, unknown>;
    const graph = payload?.['@graph'] as Record<string, unknown>;
    const assertion = graph?.['np:hasAssertion'] as Record<string, unknown[]>;
    const datasetObject = assertion?.['@graph']?.[0] as Record<string, unknown>;

    // Return if not able to retrieve chart object
    if (!datasetObject) {
      return new Error('Caching error. Dataset object is missing');
    }

    // Build chart instance object
    return {
      description:
        ((datasetObject['http://purl.org/dc/terms/description'] as unknown[])?.[0] as Record<string, unknown>)?.['@value'] ??
        (datasetObject['http://purl.org/dc/terms/description'] as Record<string, unknown>)?.['@value'],
      identifier: datasetObject['@id'],
      label:
        ((datasetObject['http://purl.org/dc/terms/title'] as unknown[])?.[0] as Record<string, unknown>)?.['@value'] ??
        (datasetObject['http://purl.org/dc/terms/title'] as Record<string, unknown>)?.['@value'],
      thumbnail:
        (datasetObject['http://xmlns.com/foaf/0.1/depiction'] as Record<string, unknown>)?.[
          'http://www.w3.org/ns/dcat#accessURL'
        ],
      doi: (datasetObject['http://purl.org/dc/terms/isReferencedBy'] as Record<string, unknown>)?.['@value'],
      organization: (datasetObject['http://xmlns.com/foaf/0.1/Organization'] as Record<string, unknown>[])?.map(
        (org: Record<string, unknown>) => {
          return (org?.['http://xmlns.com/foaf/0.1/name'] as Record<string, unknown>)?.['@value'];
        }
      ),
      distribution: (datasetObject['http://www.w3.org/ns/dcat#distribution'] as Record<string, unknown>[])?.map(
        (dist: Record<string, unknown>) => {
          return dist?.['@id'];
        }
      ),
    };
  },

  async deleteEntityNanopub(_context: Context, entityUri: string): Promise<unknown> {
    // TODO: refactor delete function to generalize to other entity types
    const response = await deleteChart(entityUri);
    return response;
  },

  async deleteEntityES(
    { rootGetters }: Context,
    payload: DeleteEntityPayload
  ): Promise<void> {
    const { identifier, type } = payload;
    const url = '/api/admin/es';
    const token = rootGetters['auth/token'];
    await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ doc: identifier, type: type }),
    });
  },

  async cacheNewEntityResponse(
    { commit, dispatch, rootGetters }: Context,
    payload: CacheEntityPayload
  ): Promise<{ response: unknown; identifier: string } | Error> {
    const { identifier, resourceNanopub, type } = payload;

    const url = '/api/admin/es';
    let resourceInstanceObject;
    if (type === 'charts') {
      resourceInstanceObject = await dispatch('createChartInstanceObject', resourceNanopub);
    } else if (type === 'datasets') {
      resourceInstanceObject = await dispatch('createDatasetInstanceObject', resourceNanopub);
    } else {
      return new Error('Caching error. Type parameter is missing or invalid');
    }

    const token = rootGetters['auth/token'];

    // 1. Check if a chart with same identifier exist in ES and delete
    if (identifier) {
      await dispatch('deleteEntityES', { identifier, type });
    }

    const fetchResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ doc: resourceInstanceObject, type }),
    });

    if (fetchResponse.status !== 200) {
      return new Error(
        fetchResponse.statusText || `Server error, cannot cache ${type} object`
      );
    }

    const response = await fetchResponse.json();
    return {
      response,
      identifier: (resourceInstanceObject as Record<string, unknown>).identifier as string,
    };
  },

  async lookupOrcid({ commit }: Context, orcidId: string): Promise<void> {
    const unhyphenated = /^\d{15}(\d|X)$/.test(orcidId);
    unhyphenated &&
      (orcidId = orcidId.replace(
        /^\(?(\d{4})\)?(\d{4})?(\d{4})?(\d{3}(\d|X))$/,
        '$1-$2-$3-$4'
      ));

    if (isValidOrcid(orcidId)) {
      const url = `/api/knowledge/instance?uri=http://orcid.org/${orcidId}`;
      const response = await fetch(url, {
        method: 'GET',
      });
      if (response?.statusText !== 'OK') {
        const snackbar = {
          message:
            response.statusText || 'Something went wrong while fetching orcid data',
          duration: 5000,
        };
        return commit('setSnackbar', snackbar, { root: true });
      }

      const responseData = await response.json();
      const cpResult = responseData.filter(
        (entry: Record<string, unknown>) => entry['@id'] === `http://orcid.org/${orcidId}`
      );
      if (cpResult.length) {
        return commit('setOrcidData', cpResult[0]);
      } else {
        // No results were returned
        return commit('setOrcidData', 'invalid');
      }
    } else {
      // Incorrect format
      return commit('setOrcidData', 'invalid');
    }
  },

  async lookupDoi({ commit }: Context, inputDoi: string): Promise<void> {
    const url = `/api/knowledge/getdoi/${inputDoi}`;
    const response = await fetch(url, {
      method: 'GET',
    });
    if (response?.statusText !== 'OK') {
      const snackbar = {
        message: response.statusText || 'Something went wrong while fetching DOI data',
        duration: 5000,
      };
      return commit('setSnackbar', snackbar, { root: true });
    }
    const responseData = await response.json();
    return commit('setDoiData', responseData);
  },

  async submitBulkXml(
    { commit, dispatch, rootGetters }: Context,
    files: File[]
  ): Promise<Response> {
    const token = rootGetters['auth/token'];
    await dispatch('createDatasetIdVuex', { isBulk: true });
    const url = `${window.location.origin}/api/curate/bulk?dataset=${rootGetters['explorer/curation/datasetId']}`;
    const formData = new FormData();
    files.forEach((file) => formData.append('uploadfile', file));
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      redirect: 'follow',
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });
    if (response?.statusText !== 'OK') {
      throw new Error(response.statusText || 'Something went wrong while submitting XMLs');
    }
    const result = await response.json();
    commit('setXmlBulkResponse', result);
    return response;
  },

  async fetchXlsList(_context: Context, payload: FetchXlsListPayload): Promise<unknown> {
    if (!payload.field) return;
    const response = await apollo.query({
      query: SEARCH_SPREADSHEETLIST_QUERY,
      variables: {
        input: {
          field: payload.field,
          pageNumber: payload?.pageNumber ?? 1,
          pageSize: 20,
        },
      },
      fetchPolicy: 'no-cache',
    });
    if (!response) {
      const error = new Error('Server error: Unable to access list!');
      throw error;
    }
    const result = response?.data?.getXlsxCurationList || {};
    return result;
  },

  async fetchCurationData(
    { commit, getters, rootGetters }: Context,
    payload: FetchCurationDataPayload | null = null
  ): Promise<void> {
    const url = !payload
      ? '/api/curate'
      : `/api/curate/get/${payload.id}?isNew=${payload?.isNew}`;
    const token = rootGetters['auth/token'];
    const curationData = getters?.getCurationFormData ?? {};

    if (Object.keys(curationData).length && !payload) return curationData;

    const fetchResponse = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + token,
      },
    });

    if (fetchResponse.status !== 200) {
      throw new Error(fetchResponse.statusText || 'Server error, cannot fetch JSON');
    }
    const response = await fetchResponse.json();
    commit('setCurationFormData', response);
  },

  // Curation Form Page Submit Function
  async submitCurationData(
    { state, commit, rootGetters }: Context,
    { xlsxObjectId = null, isNew = true }: SubmitCurationDataPayload = {}
  ): Promise<void> {
    const cId =
      state.curationFormData.Control_ID ?? state.curationFormData.CONTROL_ID ?? {};

    if (!cId?.cellValue && !xlsxObjectId) {
      throw new Error('Please enter Control_ID before submitting');
    }

    if (Object.keys(state.curationFormError).length) {
      throw new Error('Field Error: Please fill all required fields');
    }

    const data = JSON.parse(JSON.stringify(state.curationFormData));
    // Process all replace nested field
    const replaceNestedRef = state.replaceNestedRef;
    for (let i = 0; i < replaceNestedRef.length; i++) {
      const element = JSON.parse(replaceNestedRef[i]);
      const title = element.shift();
      const lastKey = element.pop();
      const refData = element.reduce(function (o: Record<string, unknown>, x: string) {
        return typeof o === 'undefined' || o === null ? o : o[x];
      }, data[title]);
      refData[lastKey] = refData[lastKey].values;
    }
    const url = !xlsxObjectId
      ? `/api/curate?isBaseObject=true&dataset=${rootGetters['explorer/curation/datasetId']}`
      : `/api/curate?xlsxObjectId=${xlsxObjectId}&isBaseUpdate=true&isNew=${isNew}`;
    const method = !xlsxObjectId ? 'POST' : 'PUT';
    const successResponse = !xlsxObjectId ? 201 : 200;
    const requestBody = !xlsxObjectId
      ? JSON.stringify({ curatedjsonObject: data })
      : JSON.stringify({ payload: data });

    const token = rootGetters['auth/token'];

    const fetchResponse = await fetch(url, {
      method: method,
      body: requestBody,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
    });

    if (fetchResponse.status === 409) {
      const response = await fetchResponse.json();
      const message = response?.message ?? 'Duplicate Curation';
      throw new Error(`${fetchResponse?.statusText}: ${message}`);
    }

    if (fetchResponse.status === 400) {
      const response = await fetchResponse.json();
      const errorObj = response?.fieldError ?? {};
      commit('setCurationFormError', errorObj);
      throw new Error('Field Error: Please fill all required fields');
    }

    if (fetchResponse.status !== successResponse) {
      throw new Error(fetchResponse.statusText || 'Server error, cannot fetch JSON');
    }
    if (fetchResponse.status === successResponse) {
      const response = await fetchResponse.json();
      const sampleId = xlsxObjectId ?? response?.sampleID ?? '';
      if (sampleId) {
        router.push({
          name: 'XmlVisualizer',
          params: { id: sampleId },
          query: { isNewCuration: isNew.toString() },
        });
      } else {
        router.push({ name: 'XmlGallery' });
      }
      commit('setCurationFormData', {});
      const snackbar = {
        message: 'Curation Successful',
        duration: 10000,
      };
      return commit('setSnackbar', snackbar, { root: true });
    }
  },

  async createControlId({ rootGetters, dispatch, commit }: Context): Promise<void> {
    const url = '/api/curate/newsampleid';
    const token = rootGetters['auth/token'];

    try {
      await dispatch('createDatasetIdVuex', { isBulk: true });

      const body = JSON.stringify({
        datasetId: rootGetters['explorer/curation/datasetId'],
      });
      const request = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body,
        method: 'POST',
      });

      const { controlID } = await request.json();
      commit('setControlID', controlID);
    } catch (error) {
      const err = error as Error;
      commit(
        'setSnackbar',
        {
          message: err?.message ?? 'Something went wrong fetching Control_ID',
          action: () => dispatch('createControlId'),
        },
        { root: true }
      );
    }
  },

  async deleteCuration(
    { commit, rootGetters, dispatch }: Context,
    payload: DeleteCurationPayload
  ): Promise<void> {
    try {
      if (!payload || !payload?.xmlId) {
        throw new Error('Incorrect query parameters');
      }
      const token = rootGetters['auth/token'];
      const { xmlId, isNew } = payload;

      await dispatch('deleteEntityNanopub', xmlId);

      const fetchResponse = await fetch(
        `/api/curate?xlsxObjectId=${xmlId}&isNew=${isNew}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
        }
      );

      if (fetchResponse.status !== 200) {
        throw new Error(
          fetchResponse.statusText || 'Server error, Unable to delete curation'
        );
      }
      const response = await fetchResponse.json();
      const snackbar = {
        message: response?.message ?? 'Delete Successful',
        duration: 5000,
      };
      return commit('setSnackbar', snackbar, { root: true });
    } catch (error) {
      const err = error as Error;
      const snackbar = {
        message: err?.message ?? 'Something went wrong',
        action: () =>
          dispatch('deleteCuration', {
            xmlId: payload.xmlId,
            isNew: payload.isNew,
          }),
      };
      commit('setSnackbar', snackbar, { root: true });
    }
  },

  async searchRor({ commit }: Context, payload: SearchRorPayload): Promise<unknown> {
    const { query, id } = payload;
    let url;
    if (query) url = `/api/knowledge/ror?query=${query}`;
    else if (id) url = `/api/knowledge/ror?id=${id}`;
    else {
      const snackbar = {
        message: 'Missing parameter from ROR search',
        duration: 10000,
      };
      return commit('setSnackbar', snackbar, { root: true });
    }
    const response = await fetch(url, {
      method: 'GET',
    });
    if (response?.statusText !== 'OK') {
      const snackbar = {
        message: response.statusText || 'Something went wrong while fetching ROR data',
        duration: 5000,
      };
      return commit('setSnackbar', snackbar, { root: true });
    }
    const responseData = await response.json();
    commit('setRorData', responseData);
    return responseData;
  },

  async approveCuration(
    { commit, rootGetters }: Context,
    { xmlViewer, callbackFn }: ApproveCurationPayload
  ): Promise<void> {
    const isAdmin = rootGetters['auth/isAdmin'];
    const token = rootGetters['auth/token'];
    if (!isAdmin) {
      return commit(
        'setSnackbar',
        {
          message: 'This action is only available to administrator',
          duration: 7000,
        },
        { root: true }
      );
    }
    commit(
      'setSnackbar',
      {
        message: 'Submitting your curation...',
        duration: 2000,
      },
      { root: true }
    );
    try {
      await saveXml(xmlViewer, token);
      commit('setDialogBox', true, { root: true });
      return callbackFn();
    } catch (error) {
      commit(
        'setSnackbar',
        {
          message: 'An error occurred during submission',
          duration: 7000,
        },
        { root: true }
      );
    }
  },

  async requestApproval(
    { commit, rootGetters, dispatch }: Context,
    { curationId, isNew }: RequestApprovalPayload
  ): Promise<void> {
    const isAdmin = rootGetters['auth/isAdmin'];
    const token = rootGetters['auth/token'];
    if (isAdmin) {
      return commit(
        'setSnackbar',
        {
          message: 'This action is only available to non administrator',
          duration: 7000,
        },
        { root: true }
      );
    }
    try {
      const response = await fetch('/api/curate/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ curationId, isNew }),
      });
      if (!response || response.status !== 200) {
        return commit(
          'setSnackbar',
          {
            message: 'Something went wrong during the request',
            action: () => dispatch('requestApproval', { curationId, isNew }),
          },
          { root: true }
        );
      }
      return commit(
        'setSnackbar',
        {
          message: 'Approval request is successful',
          duration: 7000,
        },
        { root: true }
      );
    } catch (error) {
      return commit(
        'setSnackbar',
        {
          message: 'Something went wrong during the request',
          action: () => dispatch('requestApproval', { curationId, isNew }),
        },
        { root: true }
      );
    }
  },

  async submitXmlFiles(
    { commit, rootGetters }: Context,
    files: Array<{ file: File }>
  ): Promise<void> {
    const token = rootGetters['auth/token'];
    try {
      const formData = new FormData();
      files.forEach(({ file }) => formData.append('uploadfile', file));

      const response = await fetch('/api/curate/xml', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
        },
        body: formData,
      });

      if (response && response.status === 201) {
        const { totalXMLFiles, failedXML } = await response.json();
        if (failedXML === 0) {
          commit(
            'setSnackbar',
            {
              message: 'Your XML has been successfully submitted.',
              duration: 10000,
            },
            { root: true }
          );
          await router.push('/explorer/xmls');
          return;
        } else {
          return commit(
            'setSnackbar',
            {
              message: `Submission failed for ${failedXML} out of ${totalXMLFiles} entries`,
              callToActionText: 'Click to view',
              action: () => router.push('/explorer/xmls'),
            },
            { root: true }
          );
        }
      }
    } catch (error) {
      const err = error as Error;
      return commit(
        'setSnackbar',
        { message: err.message ?? 'Something went wrong during the request' },
        { root: true }
      );
    }
  },

  async deleteEntityFiles(
    { rootGetters }: Context,
    payload: DeleteEntityFilesPayload
  ): Promise<void> {
    const { distribution, thumbnail } = payload;
    if (!distribution.length && !thumbnail) return;

    const token = rootGetters['auth/token'];
    if (thumbnail) {
      await fetch(thumbnail, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
      });
    }

    if (distribution.length) {
      for (const dist of distribution) {
        await fetch(dist, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
        });
      }
    }
  },
};
