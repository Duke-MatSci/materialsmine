import { ref, watch, Ref } from 'vue';
import { useRoute, useRouter, LocationQueryValue } from 'vue-router';

interface ExplorerQueryParamsOptions {
  localSearchMethod: () => Promise<void>;
  hasPageSize?: boolean;
  filtersActive?: Ref<boolean>;
  filter?: Ref<string>;
  renderText?: Ref<string>;
}

interface ExplorerQueryParamsReturn {
  pageNumber: Ref<number>;
  pageSize: Ref<number>;
  searchWord: Ref<string>;
  searchEnabled: Ref<boolean>;
  loadParams: (query: Record<string, LocationQueryValue | LocationQueryValue[]>) => Promise<void>;
  updateParamsAndCall: (pushNewRoute?: boolean) => Promise<void>;
  loadPrevNextImage: (event: number) => Promise<void>;
  updateSearchWord: (searchWord: string) => void;
  resetSearch: (type: string) => Promise<void>;
  checkPageSize: (pageSize: number) => void;
}

export function useExplorerQueryParams(
  options: ExplorerQueryParamsOptions
): ExplorerQueryParamsReturn {
  const route = useRoute();
  const router = useRouter();

  const { localSearchMethod, hasPageSize = true, filtersActive, filter, renderText } = options;

  // Reactive state
  const pageNumber = ref<number>(1);
  const pageSize = ref<number>(20);
  const searchWord = ref<string>('');
  const searchEnabled = ref<boolean>(false);

  // Methods
  const checkPageSize = (size: number): void => {
    if (!size || size < 1) {
      pageSize.value = 20;
    } else if (size > 50) {
      pageSize.value = 20;
    } else {
      pageSize.value = size;
    }
  };

  const updateSearchWord = (word: string): void => {
    if (!word || word.length === 0) {
      searchEnabled.value = false;
    }
    searchWord.value = word;
  };

  const updateParamsAndCall = async (pushNewRoute = false): Promise<void> => {
    searchEnabled.value = !!searchWord.value || !!filtersActive?.value;

    if (pushNewRoute) {
      const query: Record<string, string | number> = {
        page: pageNumber.value,
      };

      if (hasPageSize) {
        query.size = pageSize.value;
      }

      if (searchWord.value) {
        query.q = searchWord.value;
      }

      if (filter?.value) {
        query.type = filter.value;
      }

      await router.push({ query: query as any });
    }

    await localSearchMethod();
  };

  const loadParams = async (
    query: Record<string, LocationQueryValue | LocationQueryValue[]>
  ): Promise<void> => {
    const pageQuery = query.page;
    const sizeQuery = query.size;
    const qQuery = query.q;

    pageNumber.value =
      pageQuery && typeof pageQuery === 'string' && parseInt(pageQuery) ? +pageQuery : 1;

    if (hasPageSize) {
      if (sizeQuery && typeof sizeQuery === 'string' && parseInt(sizeQuery)) {
        checkPageSize(+sizeQuery);
      } else {
        checkPageSize(20);
      }
    }

    const searchQuery = typeof qQuery === 'string' ? qQuery : '';
    updateSearchWord(searchQuery);

    await updateParamsAndCall();
  };

  const loadPrevNextImage = async (event: number): Promise<void> => {
    pageNumber.value = event;
    await updateParamsAndCall(true);
  };

  const resetSearch = async (type: string): Promise<void> => {
    if (renderText) {
      renderText.value = `Showing all ${type}`;
    }
    await router.replace({ query: {} });
    return await loadParams({});
  };

  // Watchers
  watch(
    () => route.query,
    (newValue, oldValue) => {
      if (newValue !== oldValue) {
        loadParams(newValue);
      }
    }
  );

  watch(pageSize, (newValue, oldValue) => {
    if (newValue !== oldValue) {
      checkPageSize(newValue);
      updateParamsAndCall(true);
    }
  });

  return {
    pageNumber,
    pageSize,
    searchWord,
    searchEnabled,
    loadParams,
    updateParamsAndCall,
    loadPrevNextImage,
    updateSearchWord,
    resetSearch,
    checkPageSize,
  };
}
