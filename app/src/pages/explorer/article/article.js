import ExpHeader from '@/components/explorer/Header.vue'
import Drawer from '@/components/explorer/Drawer.vue'
import getArticleMetadata from './services/getArticleMetadata'

export default {
  name: 'Article',
  components: {
    mdAppToolbar: ExpHeader,
    Drawer
  },
  data: () => {
    return {
      toggleMenuVisibility: false,
      article: {}
    }
  },
  computed: {
    doi: function () {
      return this.$route.params.doi
    },
    doiLink: function () {
      if (this.doi) {
        return new URL(this.doi, 'https://www.doi.org')
      }
      else {
        return ''
      }
    }
  },
  watch: {
    $route: async function (newDOI) {
      this.article = await retrieveArticleMetadata({newDOI})
    }
  },
  created: async function() {
    this.article = await getArticleMetadata({doi: this.doi})
  },
  methods: {
    toggleMenu () {
      this.toggleMenuVisibility = !this.toggleMenuVisibility
    }
  }
}