<template>
  <div ref="plotlyView"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Plotly from 'plotly.js/dist/plotly.min.js';

defineOptions({
  name: 'PlotlyView',
});

interface Props {
  chart?: any;
}

const props = defineProps<Props>();

const plotlyView = ref<HTMLElement>();

const layout = ref({
  width: generateWidth(),
  height: 360,
  margin: {
    b: 40,
    t: 40,
    l: 40,
    r: 40,
  },
});

const config = ref({ responsive: true });

const container = computed(() => plotlyView.value);

const isChartInvalid = computed(() => {
  return !props.chart || !Object.keys(props.chart).length;
});

const createPlot = () => {
  if (!isChartInvalid.value) return updatePlot();
  Plotly.newPlot(container.value, [], { ...layout.value }, { ...config.value });
};

const updatePlot = () => {
  if (isChartInvalid.value) return createPlot();

  const { data = [], layout: chartLayout = {} } = props.chart;
  Plotly.newPlot(container.value, data, { ...chartLayout, ...layout.value }, { ...config.value });
};

const generateWidth = () => {
  const ww = window.innerWidth;
  if (ww > 1280) return (ww * 2) / 3 - 100;
  if (ww > 960) return (ww * 2) / 4 + 40;
  if (ww < 960) return ww * 0.86;
};

onMounted(() => {
  createPlot();
});

watch(
  () => props.chart,
  () => {
    updatePlot();
  },
  { deep: true }
);
</script>

