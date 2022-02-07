import articleMetadata from '@/modules/explorer/article/services/articleMetadata'

export default {
  name: 'Article',
  data () {
    return {
      toggleMenuVisibility: false,
      article: {},
      loading: false,
      error: null,
      articleError: null,
      citationsError: null,
      referencesError: null
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
      this.loading = true
      this.articleError = null
      this.error = null
      this.citationsError = null
      this.referencesError = null
      this.article = {}
      if (this.doi) {
        try {
          this.article = await articleMetadata.get({ doi: this.doi })
          this.loading = false
          this.articleError = this.getError('article')
          this.citationsError = this.getError('citations')
          this.referencesError = this.getError('references')

          this.error = this.referencesError || this.citationsError || this.articleError
        } catch (error) {
          this.error = error.message
          this.citationsError = true
          this.referencesError = true
          this.loading = false
        }
      }
    },
    getError(prop) {
      let base
      if (prop === 'article') {
        base = this.article
      } else {
        base = this.article[prop]
      }
      if (!base) {
        return true
      } else if (!base.ok) {
        return base.error ? base.error : `${base.status} ${base.statusText}`
      } else {
        return false
      }
    }
  }
}