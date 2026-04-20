import { ref, computed, Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useQuery } from '@vue/apollo-composable';
import { XML_FINDER } from '@/modules/gql/xml-gql';
import { useExplorerQueryParams } from './useExplorerQueryParams';

const NULL_INIT = null;

interface XmlData {
  id: string;
  title: string;
  status: string;
  isNewCuration: boolean;
  sequence: string;
  user: string;
}

interface XmlFinderResult {
  totalItems: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  xmlData: XmlData[];
}

interface XmlOperationOptions {
  autoFetch?: boolean;
}

interface XmlOperationReturn {
  // Data
  xmlFinder: Ref<XmlFinderResult | null>;
  xmlData: Ref<XmlData[]>;
  error: Ref<string | null>;
  loading: Ref<boolean>;
  dialogBoxActive: Ref<boolean>;
  dialogBoxAction: Ref<(() => Promise<void>) | null>;

  // From useExplorerQueryParams
  pageNumber: Ref<number>;
  pageSize: Ref<number>;
  searchWord: Ref<string>;
  searchEnabled: Ref<boolean>;

  // Computed
  isAuth: Ref<boolean>;
  isAdmin: Ref<boolean>;
  userId: Ref<string | null>;
  filterParams: Ref<Record<string, any>>;

  // Methods
  refetchXmlFinder: () => Promise<void>;
  isOwner: (xmlUser: string) => boolean;
  editCuration: (id: string, isNew: boolean) => void;
  confirmAction: () => void;
  openDialogBox: (id: string, isNew: boolean) => void;
  closeDialogBox: () => void;
  deleteXmlCuration: (id: string, isNew?: boolean | null) => Promise<void>;
  updateFilterParams: () => Record<string, any> | false;
  toggleDialogBox: () => void;

  // Query params methods
  loadParams: (query: Record<string, any>) => Promise<void>;
  updateParamsAndCall: (pushNewRoute?: boolean) => Promise<void>;
  loadPrevNextImage: (event: number) => Promise<void>;
  updateSearchWord: (searchWord: string) => void;
  resetSearch: (type: string) => Promise<void>;
  checkPageSize: (pageSize: number) => void;
}

export function useXmlOperation(options: XmlOperationOptions = {}): XmlOperationReturn {
  const { autoFetch = true } = options;

  const route = useRoute();
  const router = useRouter();
  const store = useStore();

  // State
  const error = ref<string | null>(null);
  const dialogBoxAction = ref<(() => Promise<void>) | null>(NULL_INIT);
  const filterParams = ref<Record<string, any>>({});

  // Computed from store
  const isAuth = computed(() => store.getters['auth/isAuthenticated']);
  const isAdmin = computed(() => store.getters['auth/isAdmin']);
  const userId = computed(() => store.getters['auth/userId']);
  const dialogBoxActive = computed(() => store.getters.dialogBox);

  // Update filter params based on auth
  const updateFilterParams = (): Record<string, any> | false => {
    if (isAuth.value) {
      filterParams.value = { user: userId.value };
      return filterParams.value;
    }
    return false;
  };

  // Initialize filter params
  updateFilterParams();

  // Local search method for explorerQueryParams
  const localSearchMethod = async (): Promise<void> => {
    await refetchXmlFinder();
  };

  // Use explorerQueryParams composable
  const {
    pageNumber,
    pageSize,
    searchWord,
    searchEnabled,
    loadParams,
    updateParamsAndCall,
    loadPrevNextImage,
    updateSearchWord,
    resetSearch,
    checkPageSize
  } = useExplorerQueryParams({
    localSearchMethod,
    hasPageSize: true
  });

  // Apollo GraphQL Query
  const { result, loading, refetch, onError } = useQuery(
    XML_FINDER,
    () => {
      updateFilterParams();
      return {
        input: {
          pageNumber: pageNumber.value,
          pageSize: parseInt(String(pageSize.value)),
          filter: {
            param: route.query?.q,
            ...filterParams.value,
            // User Portal Page: Show curation based on status depending on route
            ...(route.name === 'ApprovedCuration'
              ? { status: 'Approved' }
              : { status: 'Not_Approved' })
          }
        }
      };
    },
    {
      fetchPolicy: 'cache-first',
      enabled: autoFetch
    }
  );

  // Extract xmlFinder data
  const xmlFinder = computed(() => result.value?.xmlFinder || null);
  const xmlData = computed(() => xmlFinder.value?.xmlData || []);

  // Handle GraphQL errors
  onError((errorObj) => {
    if (errorObj.networkError) {
      const err = errorObj.networkError as any;
      error.value = `Network Error: ${err?.response?.status} ${err?.response?.statusText}`;
    } else if (errorObj.graphQLErrors) {
      error.value = errorObj.graphQLErrors.map(e => e.message).join(', ');
    }

    store.commit('setSnackbar', {
      message: error.value,
      duration: 10000
    });
  });

  // When result loads successfully, clear errors
  const xmlFinderWithErrorHandling = computed(() => {
    if (!loading.value && result.value) {
      error.value = NULL_INIT;
    }
    return xmlFinder.value;
  });

  // Methods
  const refetchXmlFinder = async (): Promise<void> => {
    if (refetch) {
      await refetch();
    }
  };

  const isOwner = (xmlUser: string): boolean => {
    return isAuth.value && xmlUser === userId.value;
  };

  const editCuration = (id: string, isNew: boolean): void => {
    router.push({
      name: 'EditXmlCuration',
      query: { isNew: String(isNew), id }
    });
  };

  const toggleDialogBox = (): void => {
    store.commit('setDialogBox');
  };

  const confirmAction = (): void => {
    if (dialogBoxAction.value) {
      // TODO (@tee): Check if xml is not ingested into KG before calling deleteXmlCuration
      // dialogBoxAction.value();
      closeDialogBox();
    }
  };

  const openDialogBox = (id: string, isNew: boolean): void => {
    if (!id) return;
    dialogBoxAction.value = () => deleteXmlCuration(id, isNew);
    toggleDialogBox();
  };

  const closeDialogBox = (): void => {
    dialogBoxAction.value = NULL_INIT;
    toggleDialogBox();
  };

  const deleteXmlCuration = async (id: string, isNew: boolean | null = NULL_INIT): Promise<void> => {
    if (id && isNew !== null) {
      await store.dispatch('explorer/curation/deleteCuration', {
        xmlId: id,
        isNew
      });
      await refetchXmlFinder();
    }
  };

  return {
    // Data
    xmlFinder: xmlFinderWithErrorHandling,
    xmlData,
    error,
    loading,
    dialogBoxActive,
    dialogBoxAction,

    // From useExplorerQueryParams
    pageNumber,
    pageSize,
    searchWord,
    searchEnabled,

    // Computed
    isAuth,
    isAdmin,
    userId,
    filterParams,

    // Methods
    refetchXmlFinder,
    isOwner,
    editCuration,
    confirmAction,
    openDialogBox,
    closeDialogBox,
    deleteXmlCuration,
    updateFilterParams,
    toggleDialogBox,

    // Query params methods
    loadParams,
    updateParamsAndCall,
    loadPrevNextImage,
    updateSearchWord,
    resetSearch,
    checkPageSize
  };
}
