import { computed } from 'vue';
import { useStore } from 'vuex';

/**
 * Explorer Search Composable
 * Manages explorer search and render functionality
 * Both: 'Keyword Search' & 'Autosuggest'
 */
export function useExplorerSearch() {
  const store = useStore();

  // Computed properties
  const searchWord = computed({
    get() {
      return store.getters['explorer/getSearchKeyword'];
    },
    async set(payload: string) {
      // await store.commit('explorer/setEnableAutosuggest', true)
      await store.commit('explorer/setSearchKeyword', payload);
      // await requestSearch(payload)
    },
  });

  const searchEnabled = computed(() => {
    return store.getters['explorer/getSearching'];
  });

  const suggestions = computed(() => {
    return store.getters['explorer/results/getSuggestions'];
  });

  const enableAutosuggest = computed(() => {
    return store.getters['explorer/getAutosuggest'];
  });

  // Methods
  const setResultsTab = (tab: string) => {
    store.commit('explorer/setResultsTab', tab);
  };

  const setSearching = () => {
    store.commit('explorer/setSearching');
  };

  const setSearchKeyword = (keyword: string) => {
    store.commit('explorer/setSearchKeyword', keyword);
  };

  const setAutosuggest = (suggestions: any[]) => {
    store.commit('explorer/results/setAutosuggest', suggestions);
  };

  const submitSearch = (payload?: string) => {
    let keyPhrase: string;
    if (typeof payload === 'string') {
      keyPhrase = payload;
    } else {
      keyPhrase = searchWord.value;
    }
    setSearching();
    setSearchKeyword(keyPhrase);
    // setAutosuggest([])
    store.dispatch('explorer/results/searchKeyword', keyPhrase);
  };

  // Debounced search function (commented out as in original)
  // const requestSearch = _.debounce(function (payload) {
  //   store.dispatch('explorer/results/autosuggestionRequest', payload)
  // }, 1000)

  return {
    // Computed
    searchWord,
    searchEnabled,
    suggestions,
    enableAutosuggest,

    // Methods
    setResultsTab,
    setSearching,
    setSearchKeyword,
    setAutosuggest,
    submitSearch,
  };
}
