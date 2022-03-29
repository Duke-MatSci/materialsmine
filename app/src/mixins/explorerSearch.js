import _ from 'lodash'
import { mapMutations, mapGetters } from 'vuex'

/**
 * Manages explorer search and render functionality
 * Both: 'Keyword Search' & 'Autosuggest'
 */
export default {
  computed: {
    searchWord: {
      get () {
        return this.$store.getters['explorer/getSearchKeyword'];
      },
      async set (payload) {
       	await this.$store.commit('explorer/setSearchKeyword', payload);
			 	await this.requestSearch(payload);
      }
    },
    searchEnabled () {
      return this.$store.getters['explorer/getSearching'];
    },
	...mapGetters({ suggestions: 'explorer/results/getSuggestions' })
  },
  methods: {
    ...mapMutations('explorer', ['setResultsTab', 'setSearching', 'setSearchKeyword']),
    ...mapMutations('explorer/results', ['setAutosuggest']),
		submitSearch (payload) {
			let keyPhrase;
			if(typeof(payload) === "string") {
				keyPhrase = payload;
			} else {
				keyPhrase = this.searchWord;
			}
			this.setSearching();
			this.setSearchKeyword(keyPhrase);
			this.setAutosuggest([]);
			this.$store.dispatch('explorer/results/searchKeyword', keyPhrase);
		},
		requestSearch: _.debounce(function(payload) { 
			this.$store.dispatch('explorer/results/autosuggestionRequest', payload);
		}, 1000),
  }
}