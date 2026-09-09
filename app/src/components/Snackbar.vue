<template>
  <div>
    <md-snackbar
      :md-position="position"
      :md-duration="snackbarDuration"
      class="md-snackbar-adjust"
      v-model:mdActive="show"
    >
      <span class="u--font-emph-sl">
        {{ snackbar?.message || '' }}
      </span>
      <MdButton
        v-if="snackbar?.action && !snackbar?.duration"
        id="snackbarAction"
        class="md-primary"
        @click="snackBarAction"
        >{{ snackbar?.callToActionText || 'Retry' }}</MdButton
      >
      <MdButton
        id="snackbarDismiss"
        class="md-icon-button"
        aria-label="Dismiss notification"
        @click="dismiss"
      >
        <md-icon>close</md-icon>
      </MdButton>
    </md-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

// Component name for debugging
defineOptions({
  name: 'Snackbar',
});

// Props
interface Props {
  position?: string;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'left', // Valid options: 'center' | 'left'
});

// Store and Router
const store = useStore();
const route = useRoute();

// Reactive data
const show = ref(false);

// Computed
const snackbar = computed(
  () =>
    store.getters.getSnackbar || {
      message: '',
      action: null,
      duration: false,
      callToActionText: 'Retry',
    }
);

// Error snackbars linger long enough to read the (often multi-word) backend
// error text; success/info toasts keep their own short duration. A falsy
// duration still means "persistent" (Infinity; dismissed via the Retry action
// or a route change), so retryable errors with an action stay until acted on.
const ERROR_MIN_MS = 8000;
const snackbarDuration = computed(() => {
  const s = snackbar.value;
  if (!s?.duration) return Infinity;
  return s.type === 'error'
    ? Math.max(s.duration as number, ERROR_MIN_MS)
    : (s.duration as number);
});

// Methods
const resetSnackbar = () => {
  show.value = false;
};

// Persistent toasts (falsy duration) previously had no exit except the Retry
// action, a route change, or a resetSnackbar commit from elsewhere. Clearing
// the store state too keeps a re-raised identical message from being swallowed
// by the watcher below.
const dismiss = (): void => {
  show.value = false;
  store.commit('resetSnackbar');
};

const snackBarAction = async () => {
  if (snackbar.value?.action) {
    show.value = false;
    return await snackbar.value.action();
  }
  show.value = false;
};

// Watchers
watch(snackbar, (val) => {
  if (val?.message) {
    show.value = true;
  } else if (val?.duration === 0) {
    resetSnackbar();
  }
});

watch(route, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    resetSnackbar();
  }
});
</script>
