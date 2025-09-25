import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

/**
 * Deploy Version Composable
 * Manages deployment version functionality
 */
export function useDeployVersion() {
  const store = useStore();

  // Reactive data
  const errorMsg = ref('Deployment Failed');

  // Computed properties
  const dialogBoxActive = computed(() => store.getters['misc/dialogBox']);
  const token = computed(() => store.getters['auth/token']);
  const isAdmin = computed(() => store.getters['auth/isAdmin']);

  const isProduction = computed(() => {
    // Version toggling is only enabled for production and not lower environment.
    return new URL(window.location.origin)?.host === 'materialsmine.org';
    // return new URL(window.location.origin)?.host === 'localhost';
  });

  // Portal state
  const isSuccess = computed(() => store.state.portal.isSuccess);
  const isError = computed(() => store.state.portal.isError);
  const isLoading = computed(() => store.state.portal.isLoading);
  const currentVersion = computed(() => store.state.portal.currentVersion);
  const loadingMessage = computed(() => store.state.portal.loadingMessage);
  const dockerVersions = computed(() => store.state.portal.dockerVersions);

  // Methods
  const toggleDialogBox = () => {
    store.commit('misc/setDialogBox');
  };

  const setCurrentVersion = (version: string) => {
    store.commit('portal/setCurrentVersion', version);
  };

  const resetDeploymentStatus = () => {
    store.commit('portal/resetDeploymentStatus');
  };

  const fetchVersions = async () => {
    await store.dispatch('portal/fetchVersions');
  };

  const deploy = async () => {
    await store.dispatch('portal/deploy');
  };

  // This closes the dialog box and resets the deployment status
  const closeDialogBox = () => {
    toggleDialogBox();
    resetDeploymentStatus();
  };

  const setVersion = (e: Event) => {
    const target = e.target as HTMLInputElement;
    store.commit('portal/setCurrentVersion', target.value);
  };

  // Watchers
  watch(dialogBoxActive, () => {
    if (dialogBoxActive.value === false) {
      resetDeploymentStatus();
    }
  });

  return {
    // Reactive data
    errorMsg,

    // Computed
    dialogBoxActive,
    token,
    isAdmin,
    isProduction,
    isSuccess,
    isError,
    isLoading,
    currentVersion,
    loadingMessage,
    dockerVersions,

    // Methods
    toggleDialogBox,
    setCurrentVersion,
    resetDeploymentStatus,
    fetchVersions,
    deploy,
    closeDialogBox,
    setVersion,
  };
}
