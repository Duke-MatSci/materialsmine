import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useQuery } from '@vue/apollo-composable';
import { XML_VIEWER } from '@/modules/gql/xml-gql';

export function useXmlViewer() {
  const route = useRoute();
  const store = useStore();

  const xmlViewer = ref<any>({});

  const { result, loading, refetch } = useQuery(
    XML_VIEWER,
    computed(() => ({
      input: {
        id: route.params.id,
        isNewCuration: route.query?.isNewCuration
          ? JSON.parse(route.query.isNewCuration as string)
          : false,
      },
    })),
    { fetchPolicy: 'cache-and-network' }
  );

  watch(
    result,
    (data) => {
      if (data) {
        xmlViewer.value = data.xmlViewer;
      }
    },
    { immediate: true }
  );

  const isAuth = computed(() => store.getters['auth/isAuthenticated']);
  const isAdmin = computed(() => store.getters['auth/isAdmin']);
  const dialogBoxActive = computed(() => store.getters.dialogBox);

  const closeDialogBox = () => {
    store.commit('setDialogBox');
  };

  const approveCuration = () => {
    store.commit('setDialogBox');
  };

  const approval = async () => {
    await store.dispatch('explorer/curation/approveCuration', { xml: xmlViewer.value });
  };

  return {
    xmlViewer,
    loading,
    refetch,
    isAuth,
    isAdmin,
    dialogBoxActive,
    closeDialogBox,
    approveCuration,
    approval,
  };
}
