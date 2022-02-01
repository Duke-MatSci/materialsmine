import getArticleMetadata from '@/modules/explorer/article/services/getArticleMetadata'

export default {
  name: 'Article',
  data () {
    return {
      toggleMenuVisibility: false,
      article: null,
      loading: false,
      error: null
    }
  },
  computed: {
    doi: function () {
      if (this.$route) {
        return this.$route.params.doi
      }
      else {
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
    $route: 'fetchData'
  },
  created () {
    this.fetchData()
  },
  methods: {
    toggleMenu () {
      this.toggleMenuVisibility = !this.toggleMenuVisibility
    },
    async fetchData () {
      this.article = null
      this.loading = true
      this.error = null
      if (this.doi) {
        getArticleMetadata({ doi: this.doi })
        .then((article) => {
          this.article = article
          this.loading = false
        })
        .catch((error) => {
          console.log(error)
          this.error = 'Error loading article metadata'
          this.loading = false
        })
      }
    }
  }
}
