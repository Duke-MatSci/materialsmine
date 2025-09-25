export default {
  async loadDatasets ({ commit, getters }, { page = 1 } = {}) {
    if (getters.getTotalPages > 0) {
      if (page < 1 || (page > 1 && page > getters.getTotalPages)) {
        throw new Error(
          `Invalid Page Number: ${page}. Must be number from 1 to ${getters.getTotalPages}`
        )
      }
    }
    const url = `/api/knowledge/datasets/?page=${page}&pageSize=${getters.getPageSize}`
    const response = await fetch(url, {
      method: 'GET'
    })
    if (!response || response?.statusText !== 'OK') {
      const error = new Error(
        response.message || 'Something went wrong!'
      )
      throw error
    }

    if (response.status === 201) {
      return
    }

    const responseData = await response.json()
    commit('setDatasetTotal', responseData.total)
    commit('setDatasetPage', page)

    if (!responseData.data) {
      return commit('setDatasetList', [])
    }

    return commit('setDatasetList', responseData.data.map(el => el._source))
  },
  async searchDatasetKeyword (context, { searchTerm, page = 1 }) {
    if (!searchTerm) return
    const url = `/api/search/filter?search=${searchTerm}&type=datasets&page=${page}&pageSize=${context.getters.getPageSize}`
    try {
      const response = await fetch(url, {
        method: 'GET'
      })

      if (!response || response.statusText !== 'OK') {
        const error = new Error(
          response?.message || 'Something went wrong'
        )
        throw error
      }
      if (response.status === 201) {
        return
      }

      const responseData = await response.json()
      const data = responseData?.data?.hits || []
      context.commit('setDatasetPage', 1)
      context.commit('setDatasetTotal', responseData?.data?.total?.value)
      return context.commit('setDatasetList', data.map(el => el?._source))
    } catch (error) {
      const snackbar = {
        message: error,
        action: () => context.dispatch('searchDatasetKeyword', { searchTerm, page })
      }
      return context.commit('setSnackbar', snackbar, { root: true })
    }
  }
}
