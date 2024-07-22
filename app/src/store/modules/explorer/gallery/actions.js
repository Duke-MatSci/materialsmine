import router from '@/router'
export default {
  async loadItems ({ commit, getters, dispatch }, { page = 1 } = {}) {
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
    if (!response || response?.statusText !== 'OK') {
      const error = new Error(response.message || 'Something went wrong!')
      throw error
    }

    if (response.status === 201) {
      return
    }

    const responseData = await response.json()
    commit('setTotal', responseData.total)
    commit('setPage', page)

    if (!responseData.data) {
      commit('setItems', [])
      return dispatch('fetchFavoriteCharts')
    }

    commit(
      'setItems',
      responseData.data.map((el) => el._source)
    )
    return dispatch('fetchFavoriteCharts')
  },

  async fetchFavoriteCharts ({ commit, rootGetters, dispatch }, root = true) {
    const token = rootGetters['auth/token']
    const name = rootGetters['auth/displayName']
    const isAdmin = rootGetters['auth/isAdmin']

    try {
      if (!token) return

      // Route the user to the correct route depending on isAdmin status
      const favoriteUrl = isAdmin ? '/favoritechart' : '/user/favorite-charts'

      const response = await fetch(
        '/api/knowledge/charts/favorites?pageSize=50',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      if (response.status !== 200) {
        const error = new Error(
          `Server error - ${response.message ?? response.statusText}`
        )
        throw error
      }

      const responseData = await response.json()
      commit(
        'setfavoriteChartItems',
        responseData.data.map((el) => el._source)
      )
      commit('setTotalFavorites', responseData.total)
      commit('setMissingCharts', responseData.missingCharts)

      if (!root) return
      const faveLength = responseData.total
      commit(
        'setSnackbar',
        {
          message: `Hi ${name}, you have ${faveLength} favourite charts`,
          ...(!faveLength && { duration: 15000 }),
          ...(!!faveLength && {
            callToActionText: 'click to view',
            action: () => router.push(`/portal${favoriteUrl}`)
          })
        },
        { root: true }
      )
    } catch (error) {
      return commit(
        'setSnackbar',
        {
          message: error?.message ?? 'Something went wrong',
          action: () => dispatch('fetchFavoriteCharts', root),
          callToActionText: 'Retry'
        },
        { root: true }
      )
    }
  },

  async bookmarkChart ({ commit, rootGetters, dispatch }, { chart }) {
    const token = rootGetters['auth/token']
    const storeCharts = rootGetters['explorer/gallery/favoriteChartItems']
    let totalData = []

    try {
      if (!token) return
      const response = await fetch('/api/knowledge/charts/favorites', {
        method: 'POST',
        body: JSON.stringify({ chartId: chart.identifier }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      if (response.status !== 200) return
      const responseData = await response.json()

      totalData = [...storeCharts, { chartId: chart.identifier }]
      commit('setfavoriteChartItems', totalData)
      commit('setSnackbar', { message: responseData.message }, { root: true })
    } catch (error) {
      return commit(
        'setSnackbar',
        {
          message: error?.message ?? 'Something went wrong',
          action: () => dispatch('fetchFavoriteCharts'),
          callToActionText: 'Retry'
        },
        { root: true }
      )
    }
  }
}
