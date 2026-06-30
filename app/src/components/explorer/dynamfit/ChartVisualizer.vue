<template>
  <div class="">
    <!-- Variant A: Manual shift file upload -->
    <div v-if="variant === 'a' && isManualMode && !hasManualFile" class="dynamfit-file-uploader">
      <p class="u_margin-bottom-small">
        Upload a CSV file containing 2 columns of T and a_T, measured at 1Hz.
      </p>
      <div class="form__file-input">
        <div class="md-theme-default">
          <label class="btn btn--primary u--b-rad" for="Transform_Method_Data_File">
            <p class="md-body-1">Upload Manual file</p>
          </label>
          <div class="md-file">
            <input
              @change="onManualFileChange"
              accept=".csv, .tsv, .txt"
              type="file"
              name="Transform_Method_Data_File"
              id="Transform_Method_Data_File"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div v-else class="u_width--max utility-bg_border-dark u--b-rad">
      <md-tabs
        :md-active-tab="dynamfitDomain === 'frequency' ? 'tab-home' : 'tab-temp-new'"
        class="form__stepper form__stepper-curate dialog-box_content u-reset-transform"
        md-dynamic-height
      >
        <md-tab id="tab-home" md-label="Complex, E*(iω)" class="u_relative">
          <PlotlyView :chart="dynamfitData['complex-chart']" key="1" />
          <div class="dynamfit-note" v-if="isTempData">
            <strong>Note:</strong> The frequency response is computed from uploaded temperature
            data, assuming WLF with universal constants
          </div>
        </md-tab>
        <md-tab id="tab-exp" md-label="E'(ω), tan(δ)">
          <PlotlyView :chart="dynamfitData['complex-tand-chart']" key="2" />
        </md-tab>
        <md-tab id="tab-temp-new" md-label="Complex, E*(T)" class="u_relative">
          <PlotlyView :chart="dynamfitData['complex-temp-chart']" key="3" />
          <div class="dynamfit-note" v-if="isFrequencyData">
            <strong>Note:</strong> The temperature response is computed from uploaded frequency
            data, assuming WLF with universal constants
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import PlotlyView from '@/components/explorer/PlotlyView.vue';
import TableComponent from '@/components/explorer/TableComponent.vue';
import { useDynamfitVariant } from '@/composables/useDynamfitVariant';

defineOptions({
  name: 'ChartVisualizer',
});

interface DynamfitData {
  'complex-chart'?: unknown;
  'complex-tand-chart'?: unknown;
  'complex-temp-chart'?: unknown;
  'temp-tand-chart'?: unknown;
  'relaxation-chart'?: unknown;
  'relaxation-spectrum-chart'?: unknown;
  mytable?: Record<string, unknown>[];
  'upload-data'?: Record<string, unknown>[];
}

const isTemp = ref(true);
const store = useStore();
const { variant } = useDynamfitVariant();

const dynamfitData = computed<DynamfitData>(() => store.getters['explorer/getDynamfitData']);

const dynamfitDomain = computed<string>(() => store.getters['explorer/getDynamfitDomain']);

const prony = computed<Record<string, unknown>[]>(
  () => store.state.explorer.dynamfitData?.mytable ?? []
);

const upload = computed<Record<string, unknown>[]>(
  () => store.state.explorer.dynamfitData?.['upload-data'] ?? []
);

const isFrequencyData = computed(() => {
  return dynamfitDomain.value === 'frequency' && dynamfitData.value['complex-chart'];
});

const isTempData = computed(() => {
  return dynamfitDomain.value === 'temperature' && dynamfitData.value['complex-temp-chart'];
});

// Variant A: manual mode detection
const isManualMode = computed<boolean>(() => {
  return store.getters['explorer/getDynamfitTransformMethod'] === 'manual';
});

const hasManualFile = computed<boolean>(() => {
  return store.getters['explorer/getDynamfitManualFile'] !== '';
});

const displayInfo = (msg: string, duration?: number): void => {
  if (msg) {
    store.commit('setSnackbar', {
      message: msg,
      duration: duration ?? 3000,
    });
  }
};

const onManualFileChange = async (e: Event): Promise<void> => {
  displayInfo('Uploading File...');
  store.commit('explorer/setDynamfitManualFile', '');
  const target = e.target as HTMLInputElement;
  const file = [...(target?.files || [])];
  const allowedTypes = ['csv', 'tsv', 'tab-separated-values', 'plain'];
  try {
    const extension = file[0]?.type?.replace(/(.*)\//, '') || file[0]?.name.split('.').pop();
    if (!extension || !allowedTypes.includes(extension)) {
      return displayInfo('Unsupported file format');
    }
    const { fileName } = await store.dispatch('uploadFile', {
      file,
      isTemp: isTemp.value,
    });

    if (fileName) {
      store.commit('explorer/setDynamfitManualFile', fileName);
      displayInfo('Upload Successful', 1500);
    }
  } catch (err) {
    const error = err as Error;
    store.commit('setSnackbar', {
      message: error?.message || 'Something went wrong',
      action: () => onManualFileChange(e),
    });
  }
};
</script>
