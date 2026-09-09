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

const generateWidth = () => {
  const ww = window.innerWidth;
  if (ww > 1280) return (ww * 2) / 3 - 100;
  if (ww > 960) return (ww * 2) / 4 + 40;
  if (ww < 960) return ww * 0.86;
};

const layout = ref({
  width: generateWidth(),
  height: 460,
  margin: {
    b: 40,
    t: 40,
    l: 40,
    r: 40,
  },
});

// The chart's own layout wins on margin, ours wins on everything else.
// Tri-VE stacks captions above the plot area and grows layout.margin.t to make
// room for them; plain object spread put our defaults last and threw that away,
// so the top caption was clipped in the browser while the figure JSON was fine.
// Height alone cannot fix it — the captions sit in paper coordinates, so a
// taller box pushes them further up while a fixed 40px margin stays put.
const mergeLayout = (chartLayout: any = {}) => ({
  ...chartLayout,
  ...layout.value,
  margin: { ...layout.value.margin, ...(chartLayout.margin ?? {}) },
});

const config = ref({ responsive: true });

const container = computed(() => plotlyView.value);

const isChartInvalid = computed(() => {
  return !props.chart || !Object.keys(props.chart).length;
});

const createPlot = () => {
  if (!container.value) return;

  if (!isChartInvalid.value) {
    const { data = [], layout: chartLayout = {} } = props.chart;
    Plotly.newPlot(container.value, data, mergeLayout(chartLayout), { ...config.value });
  } else {
    Plotly.newPlot(container.value, [], { ...layout.value }, { ...config.value });
  }
};

const updatePlot = () => {
  if (!container.value) return;

  if (isChartInvalid.value) {
    Plotly.newPlot(container.value, [], { ...layout.value }, { ...config.value });
  } else {
    const { data = [], layout: chartLayout = {} } = props.chart;
    Plotly.newPlot(container.value, data, mergeLayout(chartLayout), { ...config.value });
  }
};

onMounted(() => {
  createPlot();
});

watch(
  () => props.chart,
  () => {
    updatePlot();
  }
);
</script>

