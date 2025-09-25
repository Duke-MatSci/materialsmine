<template>
  <div :id="id"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import YASR from '@triply/yasr';

// Component name for debugging
defineOptions({
  name: 'Yasr',
});

// Props
interface Props {
  id?: string;
  results?: any;
}

const props = withDefaults(defineProps<Props>(), {
  id: 'YASR',
  results: () => null,
});

// Reactive data
const yasr = ref<any>(null);

// Methods
const setResults = (results: any) => {
  if (results && yasr.value) {
    yasr.value.setResponse(results);
  }
};

// Lifecycle
onMounted(() => {
  const element = document.getElementById(props.id);

  if (!element) {
    console.error('YASR element not found');
    return;
  }

  yasr.value = new YASR(element, {
    outputPlugins: ['table'],
    useGoogleCharts: false,
    persistency: {
      results: {
        key: () => false,
      },
    },
  } as any);

  setResults(props.results);
});

// Watchers
watch(
  () => props.results,
  (newVal) => {
    setResults(newVal);
  }
);
</script>

<style css src="@triply/yasr/build/yasr.min.css"></style>
