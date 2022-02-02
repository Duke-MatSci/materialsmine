import articleMetadata from '@/modules/explorer/article/services/articleMetadata'

export default {
  name: 'Article',
  data () {
    return {
      toggleMenuVisibility: false,
      article: {},
      loading: false,
      error: null
    }
  },
  computed: {
    doi: function () {
      if (this.$route) {
        return this.$route.params.doi
      } else {
        return null
      }
    },
    doiLink: function () {
      if (this.doi) {
        return new URL(this.doi, 'https://www.doi.org')
      } else {
        return ''
      }
    }
  },
  watch: {
    doi: 'fetchData'
  },
  created () {
    this.fetchData()
  },
  methods: {
    toggleMenu () {
      this.toggleMenuVisibility = !this.toggleMenuVisibility
    },
    async fetchData () {
      this.article = {}
      this.loading = true
      this.error = null
      if (this.doi) {
        articleMetadata.get({ doi: this.doi })
          .then((article) => {
            if (article) {
              this.article = article
              this.loading = false
            } else {
              throw new Error('Empty article returned')
            }
          })
          .catch((error) => {
            this.error = { ...error, message: `Error loading article metadata: ${error.message}` }
            this.loading = false
            console.log(error.message)
          })
      }
    }
  }
}
