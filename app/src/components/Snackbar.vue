<template>
  <div>
    <md-snackbar
      :md-position="position"
      :md-duration="!snackbar?.duration ? Infinity : snackbar.duration"
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

// Methods
const resetSnackbar = () => {
  show.value = false;
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
