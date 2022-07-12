export default {
  async loadItems ({ commit, getters }, { page = 1 } = {}) {
    if (getters.totalPages > 0) {
      if (page < 1 || (page > 1 && page > getters.totalPages)) {
        throw new Error(
          `Invalid Page Number: ${page}. Must be number from 1 to ${getters.totalPages}`
        )
      }
    }
    const url = `/api/knowledge/charts/?page=${page}&pageSize=${getters.pageSize}`
    const response = await fetch(url, {
      method: 'GET'
    })
    if (!response || response.statusText !== 'OK') {
      const error = new Error(
        response.message || 'Something went wrong!'
      )
      throw error
    }

    if (response.status === 201) {
      return
    }

    const responseData = await response.json()
    commit('setTotal', responseData.total)
    commit('setPage', page)

    if (!responseData.data) {
      return commit('setItems', [])
    }

    return commit('setItems', responseData.data.map(el => el._source))
  }
}
