import ExpHeader from '@/components/explorer/Header.vue'
import Drawer from '@/components/explorer/Drawer.vue'

export default {
  name: 'Article',
  components: {
    mdAppToolbar: ExpHeader,
    Drawer
  },
  props: {
    doi: {
      type: String,
      default: '10.1063/1.5046839'
    }
  },
  data: () => {
    return {
      toggleMenuVisibility: false,
      articleMetadata: {},
      citationsMetadata: {},
      referencesMetadata: {}
    }
  },
  created: function() {
    this.retrieveArticleMetadata()
  },
  methods: {
    toggleMenu () {
      this.toggleMenuVisibility = !this.toggleMenuVisibility
    },
    async retrieveArticleMetadata () {
      var semanticScholarBase = `https://api.semanticscholar.org/graph/v1/paper/DOI:${this.doi}/`

      var articleRequest = new URL(semanticScholarBase)
      var articleFields = ['title', 'authors', 'year', 'abstract', 'citationCount', 'isOpenAccess']
      articleRequest.search = new URLSearchParams({fields: articleFields.join(',')})

      var citationRequest = new URL(semanticScholarBase + 'citations')
      var citationFields = ['title', 'authors', 'year']
      citationRequest.search = new URLSearchParams({fields: citationFields.join(',')})

      var referencesRequest = new URL(semanticScholarBase + 'references')
      var referencesFields = ['title', 'authors', 'year']
      referencesRequest.search = new URLSearchParams({fields: referencesFields.join(',')})

      this.article = await fetchJSON(articleRequest)
      this.articleCitations = await fetchJSON(citationRequest)
      this.articleReferences = await fetchJSON(referencesRequest)
    }
  }
}

async function fetchJSON(requestURL){
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
}