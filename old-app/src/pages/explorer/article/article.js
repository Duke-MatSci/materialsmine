import articleMetadata from '@/modules/explorer/article/services/articleMetadata'
import Spinner from '@/components/Spinner'

export default {
  name: 'Article',
  components: {
    'loading-spinner': Spinner
  },
  data () {
    return {
      toggleMenuVisibility: false,
      article: {},
      loading: false,
      error: {}
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
      this.error = {}
      this.article = {}

      if (this.doi) {
        try {
          this.article = await articleMetadata.get({ doi: this.doi })
          this.loading = false

          // ensure all parts were provided, set error flags if not
          this.error = {
            article: this.getError('article'),
            citations: this.getError('citations'),
            references: this.getError('references')
          }
        } catch (error) {
          // pass error message on to user
          this.error = {
            article: error.message,
            citations: true,
            references: true
          }
          this.loading = false
        }
      }
    },
    /**
     * Checks if articleMetadata.get() returned any error.
     * @param {string} prop Part of article object to check
     * @returns As much information as is available for the error, if any.
     */
    getError (prop) {
      let base
      if (prop === 'article') {
        base = this.article
      } else {
        base = this.article[prop]
      }
      if (!base) { // if metadata wasn't returned, error is unclear
        return true
      } else if (!base.ok) { // fetch responded with error, or API did
        return base.error || `${base.status} ${base.statusText}`
      } else { // no error detected
        return false
      }
    }
  }
}
