import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * Explorer Query Parameters Composable
 * Manages URL query parameters for explorer pages
 */
export function useExplorerQueryParams() {
  const route = useRoute();
  const router = useRouter();

  // Reactive data
  const pageNumber = ref(1);
  const pageSize = ref(20);
  const searchWord = ref('');
  const searchEnabled = ref(false);
  const filter = ref('');
  const filtersActive = ref(false);
  const renderText = ref('');

  // Watch for route query changes
  watch(
    () => route.query,
    (newValue, oldValues) => {
      if (newValue !== oldValues) {
        loadParams(newValue);
      }
    },
    { deep: true }
  );

  // Watch for page size changes
  watch(pageSize, (newValue, oldValue) => {
    if (newValue !== oldValue) {
      checkPageSize(newValue);
      updateParamsAndCall(true);
    }
  });

  const loadParams = async (query: any) => {
    pageNumber.value = parseInt(query.page as string) ? +query.page : 1;
    if (pageSize.value) {
      parseInt(query.size as string) ? checkPageSize(+query.size) : checkPageSize(20);
    }
    query.q ? updateSearchWord(query.q as string) : updateSearchWord('');
    await updateParamsAndCall();
  };

  const updateParamsAndCall = async (pushNewRoute = false) => {
    searchEnabled.value = !!searchWord.value || !!filtersActive.value;
    if (pushNewRoute) {
      const query: any = {
        page: pageNumber.value,
      };
      if (pageSize.value) {
        query.size = pageSize.value;
      }
      if (searchWord.value) {
        query.q = searchWord.value;
      }
      if (filter.value) {
        query.type = filter.value;
      }
      router.push({ query });
    }
    // This will be implemented by the component using this composable
    // await localSearchMethod()
  };

  const loadPrevNextImage = async (event: number) => {
    pageNumber.value = event;
    await updateParamsAndCall(true);
  };

  const updateSearchWord = (searchWordParam: string) => {
    if (!searchWordParam || !searchWordParam.length) {
      searchEnabled.value = false;
    }
    searchWord.value = searchWordParam;
  };

  const resetSearch = async (type: string) => {
    renderText.value = `Showing all ${type}`;
    await router.replace({ query: {} });
    return await loadParams({});
  };

  const checkPageSize = (pageSizeParam: number) => {
    if (!pageSizeParam || (pageSizeParam && pageSizeParam < 1)) {
      pageSize.value = 20;
    } else if (pageSizeParam && pageSizeParam > 50) {
      pageSize.value = 20;
    } else {
      pageSize.value = pageSizeParam;
    }
  };

  return {
    // Reactive data
    pageNumber,
    pageSize,
    searchWord,
    searchEnabled,
    filter,
    filtersActive,
    renderText,

    // Methods
    loadParams,
    updateParamsAndCall,
    loadPrevNextImage,
    updateSearchWord,
    resetSearch,
    checkPageSize,
  };
}
