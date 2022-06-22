import { loadJsonView } from '@/modules/whyis-view'

const classUri = 'http://semanticscience.org/resource/Chart'

export default {
  async loadItems ({ commit, getters }, { page = 1 } = {}) {
    // Load all items if they haven't been loaded yet
    if (getters.allItems === null) {
      const startTime = performance.now()
      const allItems = await loadJsonView({ uri: classUri, view: 'instances' })
      const endTime = performance.now()
      const queryTimeMillis = endTime - startTime
      commit('setAllItems', allItems)
      commit('setQueryTimeMillis', queryTimeMillis)
    }

    // Slice a subset of all items for the requested page
    if (page < 1 || (page > 1 && page > getters.totalPages)) {
      throw new Error(
        `Invalid Page Number: ${page}. Must be number from 1 to ${getters.totalPages}`
      )
    }
    const startIndex = (page - 1) * getters.pageSize
    const endIndex = startIndex + getters.pageSize
    const items = getters.allItems.slice(startIndex, endIndex)

    commit('setPage', page)
    commit('setItems', items)
  },
}
