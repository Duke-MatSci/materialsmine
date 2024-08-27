export default {
  async fetchNsData(
    { commit, getters, dispatch },
    { forceFetch = false } = {}
  ) {
    commit('setLoading', true);
    const metrics = getters.getMetrics;
    const details = getters.getDetails;
    const classes = getters.getClasses;

    if (
      !Object.keys(metrics).length ||
      !Object.keys(details).length ||
      !classes.length ||
      forceFetch
    ) {
      try {
        const url = '/api/mn/ontology';

        const req = await fetch(url, {
          headers: {
            Accept: 'application/json'
          }
        });

        if (req.status !== 200) {
          throw new Error(
            req.statusText || 'Server error, cannot fetch namespace error'
          );
        }
        const res = await req.json();
        const { metrics, details, data, submissions } = res;
        commit('setMetrics', metrics);
        commit('setDetails', details);
        commit('setClasses', data);
        commit('setSubmissions', submissions);
      } catch (error) {
        const snackbar = {
          message: error?.message ?? 'Something went wrong fetching namespace',
          action: () => dispatch('fetchNsData', { forceFetch })
        };
        commit('setSnackbar', snackbar, { root: true });
      } finally {
        commit('setLoading', false);
      }
    }
  },
  async searchNSData(
    { getters, commit },
    { query = '', singleResult = true } = {}
  ) {
    commit('clearSearchQueries');
    if (!query) return;

    commit('showErrorResponse', false);
    const classes = getters.getClasses;

    let response = singleResult ? '' : [];

    const searchArray = (arr, query, exactMatch = false) => {
      let result = [];
      const queryLower = query.toLowerCase();
      const regex = new RegExp(query, 'i'); // Case-insensitive regex for partial matching

      for (let i = 0; i < arr.length; i++) {
        const element = arr[i];
        const elementID = element.ID.split('/')
          .pop()
          .split('#')
          .pop()
          .toLowerCase();

        // Check for exact match or partial match based on the third argument
        if (exactMatch) {
          if (elementID === queryLower) {
            return element; // Return the found element immediately for exact match
          }
        } else {
          if (elementID.search(regex) !== -1) {
            result.push(element); // Push matching element to the result for partial match
          }
        }

        // If the element has subClasses, search recursively
        if (element.subClasses && element.subClasses.length) {
          const foundInSub = searchArray(element.subClasses, query, exactMatch);
          if (exactMatch && foundInSub) {
            return foundInSub; // Return the found element immediately for exact match in subClasses
          } else if (!exactMatch && foundInSub.length) {
            result = [...result, ...foundInSub]; // Merge found elements from subClasses for partial match
          }
        }
      }

      // Return the result based on exact match or partial match
      return exactMatch ? null : result;
    };

    response = searchArray(classes, query, singleResult);
    const isError =
      (singleResult && !response) || (!singleResult && !response.length);

    commit('setSearchResult', response);
    commit('showErrorResponse', isError);
  }
};
