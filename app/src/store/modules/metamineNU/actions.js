import { processData } from '@/modules/metamine/utils/processData'
export default {
  async fetchMetamineDataset ({ commit, getters, dispatch }) {
    let csvData = getters.getDatasets
    let fetchedNames = getters.getFetchedNames
    const revalidateData = getters.getRefreshStatus
    const activeData = []

    if ((!csvData.length && !fetchedNames.length) || revalidateData) {
      // reset datasets
      csvData = []
      // fetch data from Minio
      const fetchedNamesResponse = await fetch('/api/files/metamine')
        .then((response) => response.json())
        .catch((err) => {
          commit(
            'setSnackbar',
            {
              message: err?.message ?? 'Something went wrong',
              action: () => dispatch('fetchMetamineDataset')
            },
            { root: true }
          )
        })
      // set fetchedNames
      fetchedNames = fetchedNamesResponse?.fetchedNames ?? []

      const getVisualizationList = fetchedNames.map((item) =>
        fetch(`/api/files/metamine/${item.name}`)
      )
      Promise.allSettled(getVisualizationList)
        .then(async (visualizationListResponse) => {
          for (const response of visualizationListResponse) {
            const { status, value } = response

            if (status === 'fulfilled') {
              const name = value.url.split('/metamine/')[1]
              const { fetchedData } = await value.json()
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
          commit('setFetchedNames', fetchedNames)
          commit('setDataPoint', activeData[0])
          commit('setDatasets', csvData)
          commit('setRefreshStatus', false)
          commit('setActiveData', activeData)
        })
        .catch((err) => {
          commit(
            'setSnackbar',
            {
              message: err?.message ?? 'Something went wrong',
              action: () => dispatch('fetchMetamineDataset')
            },
            { root: true }
          )
        })
    }
  }
}
