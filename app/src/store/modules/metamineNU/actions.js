import { processData } from '@/modules/metamine/utils/processData'
export default {
  async fetchMetamineDataset ({ commit, getters, dispatch }) {
    let csvData = getters.getDatasets
    let fetchedNames = getters.getFetchedNames
    const revalidateData = getters.getRefreshStatus
    const activeData = []
    const rawJson = {}
    commit('setLoadingState', true)

    if ((!csvData.length && !fetchedNames.length) || revalidateData) {
      // reset datasets
      commit('setFetchedNames', [])
      commit('setDataPoint', [])
      commit('setDatasets', [])
      csvData = []
      // fetch data from Minio
      try {
        const cache = await dispatch(
          'fetchWrapper',
          { url: '/api/files/metamine' },
          { root: true }
        ).then((res) => res.val)
        const fetchedNamesResponse = await fetch('/api/files/metamine', {
          cache
        })
          .then((response) => response.json())
          .catch(async (err) => {
            await dispatch(
              'fetchWrapper',
              { url: '/api/files/metamine', reset: true },
              { root: true }
            )

            throw new Error(err?.message ?? 'Something went wrong')
          })
        // set fetchedNames
        fetchedNames = fetchedNamesResponse?.fetchedNames ?? []

        const getVisualizationList = fetchedNames.map(async function (item) {
          item.name = decodeURI(item.name)
          const url = `/api/files/metamine/${encodeURI(item.name)}`
          const cache = await dispatch(
            'fetchWrapper',
            { url },
            { root: true }
          ).then((res) => res.val)

          return fetch(url, { cache })
        })
        await Promise.allSettled(getVisualizationList)
          .then(async (visualizationListResponse) => {
            for (const response of visualizationListResponse) {
              const { status, value } = response

              if (status === 'fulfilled') {
                const name = decodeURI(value.url.split('/metamine/')[1])
                const { fetchedData } = await value.json()
                rawJson[name] = fetchedData
                const processedData = fetchedData.map((dataset, index) =>
                  processData(dataset, index)
                )

                processedData.map((p) => {
                  p.name = name
                  p.color =
                    fetchedNames.find((item) => item.name === name)?.color ??
                    '#08233c'
                })

                csvData.push(...processedData)
                activeData.push(...processedData)
              }
            }

            // Set data to store
          })
          .catch((err) => {
            throw new Error(err?.message ?? 'Something went wrong')
          })

        commit('setFetchedNames', fetchedNames)
        commit('setRawJsonFile', rawJson)
        commit('setDataPoint', activeData[0])
        commit('setDatasets', csvData)
        commit('setRefreshStatus', false)
        commit('setActiveData', activeData)
        commit('setLoadingState', false)
      } catch (error) {
        commit(
          'setSnackbar',
          {
            message: error?.message ?? 'Something went wrong',
            action: () => dispatch('fetchMetamineDataset')
          },
          { root: true }
        )
      }
    }
  }
}
