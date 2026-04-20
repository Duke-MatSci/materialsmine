import { processData, ProcessedData, RawData } from '@/modules/metamine/utils/processData';
import { ActionContext } from 'vuex';
import { MetamineNUState, FetchedName } from './mutations';

interface RootState {
  [key: string]: any;
}

interface FetchWrapperPayload {
  url: string;
  reset?: boolean;
}

interface FetchWrapperResponse {
  val: RequestCache;
}

interface FetchedNamesResponse {
  fetchedNames?: FetchedName[];
}

interface FetchedDataResponse {
  fetchedData: RawData[];
}

export default {
  async fetchMetamineDataset({
    commit,
    getters,
    dispatch,
  }: ActionContext<MetamineNUState, RootState>) {
    let csvData: ProcessedData[] = getters.getDatasets;
    let fetchedNames: FetchedName[] = getters.getFetchedNames;
    const revalidateData: boolean = getters.getRefreshStatus;
    const activeData: ProcessedData[] = [];
    const rawJson: Record<string, RawData[]> = {};
    commit('setLoadingState', true);

    if ((!csvData.length && !fetchedNames.length) || revalidateData) {
      // reset datasets
      commit('setFetchedNames', []);
      commit('setDataPoint', []);
      commit('setDatasets', []);
      csvData = [];
      // fetch data from Minio
      try {
        const cache: RequestCache = await dispatch(
          'fetchWrapper',
          { url: '/api/files/metamine' } as FetchWrapperPayload,
          { root: true }
        ).then((res: FetchWrapperResponse) => res.val);
        const fetchedNamesResponse: FetchedNamesResponse = await fetch('/api/files/metamine', {
          cache,
        })
          .then((response) => response.json())
          .catch(async (err) => {
            await dispatch(
              'fetchWrapper',
              { url: '/api/files/metamine', reset: true } as FetchWrapperPayload,
              { root: true }
            );

            throw new Error(err?.message ?? 'Something went wrong');
          });
        // set fetchedNames
        fetchedNames = fetchedNamesResponse?.fetchedNames ?? [];

        const getVisualizationList = fetchedNames.map(async function (item: FetchedName) {
          item.name = decodeURI(item.name);
          const url = `/api/files/metamine/${encodeURI(item.name)}`;
          const cache: RequestCache = await dispatch(
            'fetchWrapper',
            { url } as FetchWrapperPayload,
            { root: true }
          ).then((res: FetchWrapperResponse) => res.val);

          return fetch(url, { cache });
        });
        await Promise.allSettled(getVisualizationList)
          .then(async (visualizationListResponse: PromiseSettledResult<Response>[]) => {
            for (const response of visualizationListResponse) {
              const { status, value } = response as PromiseFulfilledResult<Response>;

              if (status === 'fulfilled') {
                const name = decodeURI(value.url.split('/metamine/')[1]);
                const { fetchedData }: FetchedDataResponse = await value.json();
                rawJson[name] = fetchedData;
                const processedData: ProcessedData[] = fetchedData.map((dataset, index) =>
                  processData(dataset, index)
                );

                processedData.map((p) => {
                  p.name = name;
                  p.color = fetchedNames.find((item) => item.name === name)?.color ?? '#08233c';
                });

                csvData.push(...processedData);
                activeData.push(...processedData);
              }
            }

            // Set data to store
          })
          .catch((err) => {
            throw new Error(err?.message ?? 'Something went wrong');
          });

        commit('setFetchedNames', fetchedNames);
        commit('setRawJsonFile', rawJson);
        commit('setDataPoint', activeData[0]);
        commit('setDatasets', csvData);
        commit('setRefreshStatus', false);
        commit('setActiveData', activeData);
        commit('setLoadingState', false);
      } catch (error: any) {
        commit(
          'setSnackbar',
          {
            message: error?.message ?? 'Something went wrong',
            action: () => dispatch('fetchMetamineDataset'),
          },
          { root: true }
        );
      }
    }
  },
};
