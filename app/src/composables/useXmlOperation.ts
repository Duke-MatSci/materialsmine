import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useExplorerQueryParams } from './useExplorerQueryParams';
import { useQuery } from '@vue/apollo-composable';
import { XML_FINDER } from '@/modules/gql/xml-gql';

const NULL_INIT = null;

/**
 * XML Operation Composable
 * Manages XML curation operations and GraphQL queries
 */
export function useXmlOperation() {
  const store = useStore();
  const route = useRoute();
  const router = useRouter();

  // Import explorer query params functionality
  const explorerQueryParams = useExplorerQueryParams();

  // Reactive data
  const xmlFinder = ref([]);
  const pageNumber = ref(1);
  const pageSize = ref(20);
  const filterParams = ref({});
  const error = ref(null);
  const dialogBoxAction = ref<(() => Promise<void>) | null>(null);

  // Computed properties
  const isAuth = computed(() => store.getters['auth/isAuthenticated']);
  const isAdmin = computed(() => store.getters['auth/isAdmin']);
  const userId = computed(() => store.getters['auth/userId']);
  const dialogBoxActive = computed(() => store.getters['misc/dialogBox']);

  // Apollo queries
  const { result: xmlFinderResult, refetch: refetchXmlFinder } = useQuery(
    XML_FINDER,
    computed(() => getXmlFinderVariables()),
    {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'ignore',
    }
  );

  // Methods
  const toggleDialogBox = () => {
    store.commit('misc/setDialogBox');
  };

  const isOwner = (xmlUser: string) => {
    return isAuth.value && xmlUser === userId.value;
  };

  const editCuration = (id: string, isNew: boolean) => {
    router.push({
      name: 'EditXmlCuration',
      query: { isNew: isNew.toString(), id: id },
    });
  };

  const confirmAction = () => {
    if (dialogBoxAction.value) {
      // TODO (@tee): Check if xml is not ingested into KG before calling `dialogBoxAction()` to delete
      // dialogBoxAction();
      closeDialogBox();
    }
  };

  const openDialogBox = (id: string, isNew: boolean) => {
    if (!id) return;
    dialogBoxAction.value = () => deleteXmlCuration(id, isNew);
    toggleDialogBox();
  };

  const closeDialogBox = () => {
    dialogBoxAction.value = NULL_INIT;
    toggleDialogBox();
  };

  const deleteXmlCuration = async (id: string, isNew: boolean | null = null) => {
    if (id && isNew !== null) {
      await store.dispatch('explorer/curation/deleteCuration', {
        xmlId: id,
        isNew: isNew,
      });
      // Refetch XML data after deletion
      await refetchXmlFinder();
    }
  };

  const updateFilterParams = () => {
    return isAuth.value && (filterParams.value = { user: userId.value });
  };

  // Apollo query variables (for use with Vue Apollo)
  const getXmlFinderVariables = () => {
    updateFilterParams();
    return {
      input: {
        pageNumber: pageNumber.value,
        pageSize: parseInt(pageSize.value.toString()),
        filter: {
          param: route.query?.q,
          ...filterParams.value,
          // User Portal Page: Show curation based on status depending on a route a user entered.
          ...(route.name === 'ApprovedCuration'
            ? { status: 'Approved' }
            : { status: 'Not_Approved' }),
        },
      },
    };
  };

  // Error handling for GraphQL queries
  const handleGraphQLError = (error: any) => {
    if (error.networkError) {
      const err = error.networkError;
      const errorMessage = `Network Error: ${err?.response?.status} ${err?.response?.statusText}`;
      error.value = errorMessage;
    } else if (error.graphQLErrors) {
      error.value = error.graphQLErrors;
    }
    store.commit('misc/setSnackbar', {
      message: error.value,
      duration: 10000,
    });
  };

  return {
    // Reactive data
    xmlFinder: xmlFinderResult,
    filterParams,
    error,
    dialogBoxAction,

    // Computed
    isAuth,
    isAdmin,
    userId,
    dialogBoxActive,

    // Methods
    toggleDialogBox,
    isOwner,
    editCuration,
    confirmAction,
    openDialogBox,
    closeDialogBox,
    deleteXmlCuration,
    updateFilterParams,
    getXmlFinderVariables,
    handleGraphQLError,

    // Explorer query params
    ...explorerQueryParams,
  };
}
