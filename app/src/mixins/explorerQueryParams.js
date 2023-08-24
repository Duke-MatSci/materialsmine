export default {
  watch: {
    '$route.query' (newValue, oldValues) {
      if (newValue !== oldValues) {
        this.loadParams(newValue)
      }
    },
    pageSize (newValue, oldValue) {
      if (newValue !== oldValue) {
        this.checkPageSize(newValue)
        this.updateParamsAndCall(true)
      }
    }
  },
  methods: {
    async loadParams (query) {
      this.pageNumber = parseInt(query.page) ? +query.page : 1
      if (this.pageSize) { parseInt(query.size) ? this.checkPageSize(+query.size) : this.checkPageSize(20) }
      query.q ? this.updateSearchWord(query.q) : this.updateSearchWord('')
      await this.updateParamsAndCall()
    },
    async updateParamsAndCall (pushNewRoute = false) {
      this.searchEnabled = !!this.searchWord || !!this?.filtersActive
      if (pushNewRoute) {
        const query = {
          page: this.pageNumber
        }
        if (this.pageSize) { query.size = this.pageSize }
        if (this.searchWord) { query.q = this.searchWord }
        if (this.filter) { query.type = this.filter }
        this.$router.push({ query })
      }
      await this.localSearchMethod()
    },
    async loadPrevNextImage (event) {
      this.pageNumber = event
      await this.updateParamsAndCall(true)
    },
    updateSearchWord (searchWord) {
      if (!searchWord && !searchWord.length > 0) this.searchEnabled = false
      this.searchWord = searchWord
    },
    async resetSearch (type) {
      this.renderText = `Showing all ${type}`
      await this.$router.replace({ query: {} })
      return await this.loadParams({})
    },
    checkPageSize (pageSize) {
      if (!pageSize || (pageSize && pageSize < 1)) {
        this.pageSize = 20
      } else if (pageSize && pageSize > 50) {
        this.pageSize = 20
      } else {
        this.pageSize = pageSize
      }
    }
  }
}
