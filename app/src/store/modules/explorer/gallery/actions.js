const placeholderDesc = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
export default {
  async loadItems ({commit, getters}, {page=1} = {}) {
    // Loads dummy items for now
    if (page < 1 || page > 1 && page > getters.totalPages) {
      throw `Invalid Page Number: ${page}. Must be number from 1 to ${getters.totalPages}`
    }
    const startIndex = (page - 1) * getters.pageSize
    const total = 333
    const items = [...Array(getters.pageSize).keys()]
      .map(i => i + startIndex + 1)
      .filter(i => i <= total)
      .map(i => ({
        id: `gallery_item_${i}`,
        label: `Gallery Item #${i}: ${placeholderDesc.slice(0, Math.random()*50)}`,
        description: placeholderDesc.slice(0, Math.random()*placeholderDesc.length)
      }))

    commit('setPage', page)
    commit('setTotal', total)
    commit('setItems', items)
  }
}
