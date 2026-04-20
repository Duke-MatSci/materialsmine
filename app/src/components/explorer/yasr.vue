<template>
  <div :id="id"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, getCurrentInstance } from 'vue';
import YASR from '@triply/yasr';

interface Props {
  id?: string;
  results?: Record<string, any> | null;
}

const props = withDefaults(defineProps<Props>(), {
  id: 'YASR',
  results: null,
});

const instance = getCurrentInstance();
const yasr = ref<any>(null);

const setResults = (results: Record<string, any> | null): void => {
  if (results && yasr.value) {
    yasr.value.setResponse(results);
  }
};

onMounted(() => {
  const el = instance?.proxy?.$el;

  yasr.value = new YASR(el, {
    outputPlugins: ['table'],
    useGoogleCharts: false,
    persistency: {
      results: {
        key: () => false,
      },
    },
  });

  setResults(props.results);
});

watch(
  () => props.results,
  (newVal) => {
    setResults(newVal);
  }
);
</script>

<style css src="@triply/yasr/build/yasr.min.css"></style>
