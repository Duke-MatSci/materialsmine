import ExpHeader from '@/components/explorer/Header.vue'
import Drawer from '@/components/explorer/Drawer.vue'

export default {
  name: 'Article',
  props: {
    doi: {
      type: String,
      default: '10.1063/1.5046839'
    }
  },
  components: {
    mdAppToolbar: ExpHeader,
    Drawer
  },
  data: () => {
    return {
      toggleMenuVisibility: false,
      articleMetadata: {},
      citationsMetadata: {},
      referencesMetadata: {}
    }
  },
  methods: {
    toggleMenu () {
      this.toggleMenuVisibility = !this.toggleMenuVisibility
    },
    async fetchJSON (requestURL){
      return fetch(requestURL).then(response => {
        if (!response.ok) {
          response.text().then(data => { 
            throw new Error(`${response.status} ${JSON.parse(data).error}`) 
          })
        }
        else {
          return response.json()
        }
      }).then(data => {
        return data
      }).catch(error => {
        console.error('Error while fetching DOI:', error)
      })
    },
    async retrieveArticleMetadata () {
      var semanticScholarAPI = `https://api.semanticscholar.org/graph/v1/paper/DOI:${this.doi}`
      var articleFields = ['title', 'authors', 'year', 'abstract', 'citationCount', 'isOpenAccess']
      var articleRequest = `${semanticScholarAPI}?fields=${articleFields.join(',')}`
      var citationFields = ['title', 'authors', 'year']
      var citationRequest = `${semanticScholarAPI}/citations?fields=${citationFields.join(',')}`
      var referencesFields = ['title', 'authors', 'year']
      var referencesRequest = `${semanticScholarAPI}/references?fields=${referencesFields.join(',')}`

      this.articleMetadata = await this.fetchJSON(articleRequest)
      this.citationsMetadata = await this.fetchJSON(citationRequest)
      this.referencesMetadata = await this.fetchJSON(referencesRequest)
    }
  },
  created: function() {
    this.retrieveArticleMetadata()
  }
}