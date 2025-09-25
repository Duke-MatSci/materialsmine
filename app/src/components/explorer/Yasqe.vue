<template>
  <div :id="id" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import Yasqe from '@triply/yasqe';

// Component name for debugging
defineOptions({
  name: 'Yasqe',
});

// Props
interface Props {
  id?: string;
  value?: string;
  endpoint?: string;
  showBtns?: boolean;
  readOnly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  id: 'YASQE',
  value: '',
  endpoint: '/api/knowledge/sparql',
  showBtns: true,
  readOnly: false,
});

// Emits
const emit = defineEmits<{
  input: [value: string];
  'query-error': [args: any];
  'query-success': [response: any];
}>();

// Store
const store = useStore();

// Reactive data
const editorValue = ref(props.value);
const yasqe = ref<any>(null);

// Methods
const initializeYasqe = () => {
  const token = store.getters['auth/token'];
  const element = document.getElementById(props.id);

  if (!element) {
    console.error('YASQE element not found');
    return;
  }

  yasqe.value = new Yasqe(element, {
    readonly: props.readOnly,
    showQueryButton: props.showBtns,
    requestConfig: {
      endpoint: props.endpoint,
      method: 'POST',
      headers: () => ({
        authorization: 'Bearer ' + token,
      }),
    },
  } as any);

  yasqe.value.setValue(props.value);
  setTimeout(() => yasqe.value.refresh(), 1);

  yasqe.value.on('error', function () {
    console.error('YASQE query error', arguments);
    emit('query-error', arguments);
  });

  yasqe.value.on('queryResults', function (yasqeInstance: any, response: any, duration: number) {
    emit('input', yasqe.value.getValue());
    emit('query-success', response);
  });
};

// Lifecycle
onMounted(() => {
  initializeYasqe();
});

// Watchers
watch(
  () => props.value,
  (value) => {
    if (value !== editorValue.value && yasqe.value) {
      yasqe.value.setValue(value);
    }
  }
);
</script>

<style css src="@triply/yasqe/build/yasqe.min.css"></style>
