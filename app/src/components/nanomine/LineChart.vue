<template>
  <div class="md-layout section_LineChart">
    <div class="md-layout-item md-size-20 md-alignment-top-left md-layout md-gutter">
      <div class="md-layout-item">
        <md-switch v-model="xLogScale" class="md-layout-item md-size-100"
          >x Axis Log Scale</md-switch
        >
        <md-switch v-model="yLogScale" class="md-layout-item md-size-100"
          >y Axis Log Scale</md-switch
        >
      </div>
    </div>
    <div class="md-layout-item">
      <svg
        :width="width + margin.left + margin.right"
        :height="height + margin.top + margin.bottom"
        class="nm-linechart"
      >
        <g :transform="`translate(${margin.left + 3}, ${10})`">
          <!-- Axes -->
          <g class="x-axis" :transform="`translate(0, ${height})`"></g>
          <g class="y-axis"></g>
          <!-- Axis Labels -->
          <g>
            <text
              class="x-axis-label"
              :transform="`translate(${width / 2}, ${height + margin.top + 20})`"
              style="text-anchor: middle"
            ></text>
            <text
              class="y-axis-label"
              :transform="`rotate(-90)`"
              :y="`${0 - margin.left}`"
              :x="`${0 - height / 2}`"
              :dy="`1em`"
              style="text-anchor: middle"
            ></text>
          </g>
          <!-- Line -->
          <g>
            <path class="nm-line" d=""></path>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import * as d3 from 'd3';

// Component name for debugging
defineOptions({
  name: 'LineChart',
});

// TypeScript interfaces
interface DataPoint {
  x: number;
  y: number;
}

interface Dataset {
  data: DataPoint[];
  xlabel: string;
  ylabel: string;
}

interface ChartOptions {
  width?: number;
  height?: number;
}

interface Margin {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

interface Scales {
  x: d3.ScaleLinear<number, number> | d3.ScaleLogarithmic<number, number> | null;
  y: d3.ScaleLinear<number, number> | d3.ScaleLogarithmic<number, number> | null;
}

// Props
interface Props {
  dataset: Dataset;
  options?: ChartOptions;
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({}),
});

// Reactive data
const width = ref(0);
const height = ref(0);
const margin = ref<Margin>({
  left: 70,
  right: 40,
  bottom: 50,
  top: 40,
});
const scales = ref<Scales>({
  x: null,
  y: null,
});
const data = ref<DataPoint[]>([]);
const xlabel = ref('');
const ylabel = ref('');
const xLogScale = ref(false);
const yLogScale = ref(false);

// Methods
/**
 * setSize: This method will set the width, height
 * and also the margins of the chart.
 */
const setSize = () => {
  // Width and Height
  width.value = (props.options?.width || 400) - margin.value.left - margin.value.right;
  height.value = (props.options?.height || 250) - margin.value.top - margin.value.top;
};

const setScales = () => {
  if (!xLogScale.value) {
    scales.value.x = d3
      .scaleLinear()
      .domain(d3.extent(data.value, (d) => d.x) as [number, number])
      .range([0, width.value]);
  } else {
    scales.value.x = d3
      .scaleLog()
      .domain(d3.extent(data.value, (d) => d.x) as [number, number])
      .range([0, width.value]);
  }

  if (!yLogScale.value) {
    scales.value.y = d3
      .scaleLinear()
      .domain(d3.extent(data.value, (d) => d.y) as [number, number])
      .range([height.value, 0]);
  } else {
    scales.value.y = d3
      .scaleLog()
      .domain(d3.extent(data.value, (d) => d.y) as [number, number])
      .range([height.value, 0]);
  }
};

const renderAxes = (strokeColor: string) => {
  if (!scales.value.x || !scales.value.y) return;

  d3.select('.x-axis')
    .call(d3.axisBottom(scales.value.x).ticks(7))
    .selectAll('.tick line')
    .attr('stroke', strokeColor)
    .attr('stroke-opacity', '0.8');

  d3.select('.y-axis')
    .call(d3.axisLeft(scales.value.y).ticks(5))
    .selectAll('.tick line')
    .attr('stroke', strokeColor)
    .attr('stroke-opacity', '0.8');

  // Change axis label text
  d3.select('.x-axis-label').text(xlabel.value);
  d3.select('.y-axis-label').text(ylabel.value);

  // Change text color
  d3.selectAll('.y-axis text').attr('color', strokeColor);
  d3.selectAll('.x-axis text').attr('color', strokeColor);

  // Change path color
  d3.selectAll('.y-axis path').attr('stroke', strokeColor).attr('stroke-opacity', '0.8');
  d3.selectAll('.x-axis path').attr('stroke', strokeColor).attr('stroke-opacity', '0.8');
};

const line = () => {
  const { x, y } = scales.value;
  if (!x || !y) return null;
  return d3
    .line<DataPoint>()
    .x((d) => x(d.x))
    .y((d) => y(d.y));
};

const renderLine = () => {
  const lineGenerator = line();
  if (lineGenerator) {
    d3.select('.nm-line').datum(data.value).attr('d', lineGenerator as any);
  }
};

const init = () => {
  if (data.value.length > 0) {
    const strokeColor = '#000';
    setSize();
    setScales();
    renderAxes(strokeColor);
    renderLine();
  }
};

// Watchers
watch(
  () => props.dataset,
  (newDataset) => {
    data.value = newDataset.data;
    xlabel.value = newDataset.xlabel;
    ylabel.value = newDataset.ylabel;
    init();
  }
);

watch(xLogScale, () => {
  init();
});

watch(yLogScale, () => {
  init();
});

// Lifecycle
onMounted(() => {
  data.value = props.dataset.data;
  xlabel.value = props.dataset.xlabel;
  ylabel.value = props.dataset.ylabel;
  init();
});
</script>
