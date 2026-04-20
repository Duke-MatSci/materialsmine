<template>
  <div class="range-selector-wrapper">
    <div class="md-title u--font-emph-700">Property Range</div>
    <div class="slider" v-for="(name, index) in rangeList" :key="index">
      <div class="u--layout-flex u--layout-flex-justify-sb u_centralize_items">
        <div style="width: 20%">{{ name }}</div>
        <div style="width: 80%">
          <div
            class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__rel"
          >
            <input
              class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__abs utility-transparentbg"
              type="range"
              v-bind:min="defaultValues[index][0]"
              v-bind:max="defaultValues[index][1]"
              step="1"
              v-model="values[index][0]"
              @change="handleMinSliderChangeFuncs($event, index)"
            />
            <input
              class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__abs utility-transparentbg"
              type="range"
              v-bind:min="defaultValues[index][0]"
              v-bind:max="defaultValues[index][1]"
              step="1"
              v-model="values[index][1]"
              @change="handleMaxSliderChangeFuncs($event, index)"
            />
          </div>
          <div class="u--layout-flex u--layout-flex-justify-sb">
            <div class="u--color-grey-sec">
              {{ sigFigs(defaultValues[index][0], 4) }}
            </div>
            <div class="u--color-grey-sec">
              {{ sigFigs(defaultValues[index][1], 4) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import sigFigs from '@/modules/metamine/utils/sigFigs';

interface DataItem {
  name: string;
  C11: number;
  C12: number;
  C22: number;
  C16: number;
  C26: number;
  C66: number;
  [key: string]: any;
}

const store = useStore();

// Data
const rangeList = ref<string[]>(['C11', 'C12', 'C22', 'C16', 'C26', 'C66']);

// Computed
const activeData = computed(() => store.state.metamineNU.activeData as DataItem[]);
const datasets = computed(() => store.state.metamineNU.datasets as DataItem[]);
const dataLibrary = computed(() => store.state.metamineNU.dataLibrary as DataItem[]);

const defaultValues = computed(() => {
  if (datasets.value.length > 0) {
    const range = rangeList.value.map((name) => [
      Math.min(...datasets.value.map((d) => d[name])),
      Math.max(...datasets.value.map((d) => d[name]))
    ]);
    return range;
  } else {
    const range = rangeList.value.map(() => [0, 0]);
    return range;
  }
});

const values = computed(() => {
  if (activeData.value.length > 0) {
    return rangeList.value.map((name) => [
      Math.min(...activeData.value.map((d) => d[name])),
      Math.max(...activeData.value.map((d) => d[name]))
    ]);
  } else {
    return rangeList.value.map(() => [0, 0]);
  }
});

// Watch - Deep watchers for reactive updates
watch(
  activeData,
  () => {
    // Deep watch activeData for reactive updates
  },
  { deep: true }
);

watch(
  dataLibrary,
  () => {
    // Deep watch dataLibrary for reactive updates
  },
  { deep: true }
);

// Methods
const handleMinSliderChangeFuncs = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement;
  if (parseFloat(target.value) > values.value[index][1]) {
    values.value[index][0] = values.value[index][1];
  }
  const activeDatasetNames = activeData.value.map((d) => d.name);
  const filteredDatasets = datasets.value.filter((d) => {
    const filtered =
      d[rangeList.value[index]] >= values.value[index][0] &&
      d[rangeList.value[index]] <= values.value[index][1] &&
      activeDatasetNames.includes(d.name);
    return filtered;
  });
  let sourceItems = dataLibrary.value;
  const destItems = filteredDatasets;
  const unselected = activeData.value.filter(
    (d) => !filteredDatasets.includes(d)
  );

  sourceItems = sourceItems.concat(unselected);
  store.commit('metamineNU/setActiveData', destItems);
  store.commit('metamineNU/setDataLibrary', sourceItems);
};

const handleMaxSliderChangeFuncs = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement;
  if (parseFloat(target.value) < values.value[index][0]) {
    values.value[index][1] = values.value[index][0];
  }
  const activeDatasetNames = activeData.value.map((d) => d.name);
  const filteredDatasets = datasets.value.filter((d) => {
    const filtered =
      d[rangeList.value[index]] >= values.value[index][0] &&
      d[rangeList.value[index]] <= values.value[index][1] &&
      activeDatasetNames.includes(d.name);
    return filtered;
  });
  let sourceItems = dataLibrary.value;
  const destItems = filteredDatasets;
  const unselected = activeData.value.filter(
    (d) => !filteredDatasets.includes(d)
  );

  sourceItems = sourceItems.concat(unselected);
  store.commit('metamineNU/setActiveData', destItems);
  store.commit('metamineNU/setDataLibrary', sourceItems);
};
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'RangeSelector'
});
</script>
