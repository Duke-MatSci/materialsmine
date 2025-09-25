<template>
  <div class="u_width--max utility-bg_border-dark u--b-rad">
    <md-tabs
      :md-active-tab="dynamfitDomain === 'frequency' ? 'tab-home' : 'tab-temp-new'"
      class="form__stepper form__stepper-curate dialog-box_content u-reset-transform"
      md-dynamic-height
    >
      <md-tab id="tab-home" md-label="Complex, E*(iω)" class="u_relative">
        <PlotlyView :chart="dynamfitData['complex-chart']" key="1" />
        <div class="dynamfit-note" v-if="isTempData">
          <strong>Note:</strong> The frequency response is computed from uploaded temperature data,
          assuming WLF with universal constants
        </div>
      </md-tab>
      <md-tab id="tab-exp" md-label="E'(ω), tan(δ)">
        <PlotlyView :chart="dynamfitData['complex-tand-chart']" key="2" />
      </md-tab>
      <md-tab id="tab-temp-new" md-label="Complex, E*(T)" class="u_relative">
        <PlotlyView :chart="dynamfitData['complex-temp-chart']" key="3" />
        <div class="dynamfit-note" v-if="isFrequencyData">
          <strong>Note:</strong> The temperature response is computed from uploaded frequency data,
          assuming WLF with universal constants
        </div>
      </md-tab>
      <md-tab id="tab-temp" md-label="E'(T), tan(δ)">
        <PlotlyView :chart="dynamfitData['temp-tand-chart']" key="4" />
      </md-tab>
      <md-tab id="tab-relax" md-label="Relaxation, E(t)">
        <PlotlyView :chart="dynamfitData['relaxation-chart']" key="5" />
      </md-tab>
      <md-tab id="tab-spec" md-label="R Spectrum, H(𝜏)">
        <PlotlyView :chart="dynamfitData['relaxation-spectrum-chart']" key="6" />
      </md-tab>
      <md-tab id="tab-upload" md-label="Uploaded Data">
        <TableComponent :tableData="upload" sortBy="i" />
      </md-tab>
      <md-tab id="tab-Prony" md-label="Prony Coeff">
        <TableComponent :tableData="prony" sortBy="i" />

        <download-csv :data="prony" name="fit_coef.csv">
          <button :disabled="!prony.length" class="md-button btn btn--primary u--b-rad">
            Download Coefficients
          </button>
        </download-csv>
      </md-tab>
    </md-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import PlotlyView from '@/components/explorer/PlotlyView.vue';
import TableComponent from '@/components/explorer/TableComponent.vue';
import JsonCSV from 'vue-json-csv';

defineOptions({
  name: 'ChartVisualizer',
});

const store = useStore();

const dynamfitData = computed(() => store.getters['explorer/getDynamfitData']);
const dynamfitDomain = computed(() => store.getters['explorer/getDynamfitDomain']);

const prony = computed(() => store.state.explorer.dynamfitData?.mytable ?? []);
const upload = computed(() => store.state.explorer.dynamfitData?.['upload-data'] ?? []);

const isFrequencyData = computed(() => {
  return dynamfitDomain.value === 'frequency' && dynamfitData.value['complex-chart'];
});

const isTempData = computed(() => {
  return dynamfitDomain.value === 'temperature' && dynamfitData.value['complex-temp-chart'];
});

// Vue 3 watch dynamfitData and console log it both old and new values
watch(
  dynamfitData,
  (newVal, oldVal) => {
    console.log('New Value:', newVal);
    console.log('Old Value:', oldVal);
  },
  { deep: true, immediate: true }
);
</script>

