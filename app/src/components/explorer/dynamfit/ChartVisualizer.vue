<template>
  <div class="">
    <!-- Charts -->
    <div class="u_width--max utility-bg_border-dark u--b-rad">
      <md-tabs
        :md-active-tab="controlledTab"
        class="form__stepper form__stepper-curate dialog-box_content u-reset-transform"
        md-dynamic-height
        @md-changed="onTabChanged"
      >
        <md-tab id="tab-home" md-label="Complex, E*(iω)" class="u_relative">
          <PlotlyView :chart="dynamfitData['complex-chart']" key="1" />
        </md-tab>
        <md-tab id="tab-exp" md-label="E'(ω), tan(δ)">
          <PlotlyView :chart="dynamfitData['complex-tand-chart']" key="2" />
        </md-tab>
        <md-tab id="tab-temp-new" md-label="Complex, E*(T)" class="u_relative">
          <PlotlyView :chart="dynamfitData['complex-temp-chart']" key="3" />
        </md-tab>
        <md-tab id="tab-temp" md-label="E'(T), tan(δ)">
          <PlotlyView :chart="dynamfitData['temp-tand-chart']" key="4" />
        </md-tab>
        <md-tab id="tab-relax" md-label="Relaxation, E(t)">
          <PlotlyView :chart="dynamfitData['relaxation-chart']" key="5" />
        </md-tab>
        <md-tab id="tab-spec" md-label="Discrete Spectrum, Eᵢ">
          <PlotlyView :chart="dynamfitData['relaxation-spectrum-chart']" key="6" />
        </md-tab>
        <md-tab id="tab-upload" md-label="Uploaded Data">
          <TableComponent :tableData="upload" sortBy="i" />

          <button
            class="md-button btn btn--primary u--b-rad"
            :disabled="!upload.length"
            @click="downloadCsv(upload, uploadCsvName)"
          >
            Download Data
          </button>
        </md-tab>
        <md-tab id="tab-Prony" md-label="Prony Coeff">
          <TableComponent :tableData="prony" sortBy="i" />

          <button
            class="md-button btn btn--primary u--b-rad"
            :disabled="!prony.length"
            @click="downloadCsv(prony, pronyCsvName)"
          >
            Download Coefficients
          </button>
        </md-tab>
      </md-tabs>
    </div>

    <!-- File name bar -->
    <div v-if="fileUpload" class="dynamfit-file-bar">
      <!-- The server name is a mangled `<adjective_animal>-<ISO>-<original>`,
           so lead with what the user recognises and keep the real name in the
           tooltip. Truncation is CSS, not JS, so the tooltip stays complete. -->
      <span class="dynamfit-file-bar__name" :title="fileUpload">
        <strong>{{ fileMeta.label || fileMeta.originalName || fileUpload }}</strong>
        <span v-if="fileMeta.label && fileMeta.originalName" class="dynamfit-file-bar__file">
          {{ fileMeta.originalName }}
        </span>
      </span>
      <button
        class="btn btn--primary dynamfit-file-bar__change"
        @click.prevent="handleFileBarAction"
      >
        {{ sourceType === 'surprise' ? 'Surprise Me' : 'Change' }}
      </button>
    </div>

    <!-- Both tabs on a cross-domain axis are derived, not measured, so the
         provenance note belongs on each of them, not just the first. -->
    <div
      class="dynamfit-note dynamfit-note--below"
      v-if="isTempData && onFreqTab && freqChartsBuilt"
    >
      <b>Note:</b> The frequency response is computed from uploaded temperature data, using your
      selected shift factor model
    </div>
    <div
      class="dynamfit-note dynamfit-note--below"
      v-if="isFrequencyData && onTempTab && tempChartsBuilt"
    >
      <b>Note:</b> The temperature response is computed from uploaded frequency data, using your
      selected shift factor model
    </div>

    <!-- The cross-domain charts are only built when a transform was requested.
         Say why the tab is blank rather than leaving the user staring at it. -->
    <div
      class="dynamfit-note dynamfit-note--below"
      v-if="isFrequencyData && onTempTab && !tempChartsBuilt"
    >
      <b>Note:</b> Check <b>ω-T Transformation</b> in the settings panel to compute the
      temperature response from this frequency data.
    </div>
    <div
      class="dynamfit-note dynamfit-note--below"
      v-if="isTempData && onFreqTab && !freqChartsBuilt"
    >
      <b>Note:</b> Check <b>ω-T Transformation</b> in the settings panel to compute the
      frequency response from this temperature data.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import PlotlyView from '@/components/explorer/PlotlyView.vue';
import TableComponent from '@/components/explorer/TableComponent.vue';
import { downloadCsv } from '@/composables/useCsvDownload';

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

const activeTab = ref('');
const store = useStore();

const emit = defineEmits<{
  (e: 'change-file'): void;
  (e: 'surprise-me'): void;
}>();

const sourceType = computed(() => store.state.explorer.dynamfitSourceType);

const fileMeta = computed<{ label: string; originalName: string }>(
  () => store.state.explorer.dynamfitFileMeta ?? { label: '', originalName: '' }
);

const handleFileBarAction = (): void => {
  if (sourceType.value === 'surprise') {
    emit('surprise-me');
  } else {
    emit('change-file');
  }
};

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

// A chart key is always present in the response; what varies is whether it
// carries any traces. The server returns an empty figure for the cross-domain
// charts when no ω-T transform was requested.
const chartHasTraces = (key: keyof DynamfitData): boolean => {
  const chart = dynamfitData.value[key] as { data?: unknown[] } | undefined;
  return !!chart?.data?.length;
};

const freqChartsBuilt = computed(() => chartHasTraces('complex-chart'));
const tempChartsBuilt = computed(() => chartHasTraces('complex-temp-chart'));

const onFreqTab = computed(() => ['tab-home', 'tab-exp'].includes(activeTab.value));
const onTempTab = computed(() => ['tab-temp-new', 'tab-temp'].includes(activeTab.value));

const dynamfit = computed(() => store.getters['explorer/dynamfit']);
const fileUpload = computed(() => dynamfit.value?.fileUpload || '');

// Name exports after whatever the user recognises the dataset as, not after
// the mangled server-side upload name.
const csvBaseName = computed<string>(() => {
  const source =
    fileMeta.value.label || fileMeta.value.originalName || fileUpload.value || 'dynamfit';
  return (
    source
      .replace(/\.[^.]+$/, '')
      .replace(/[^\w.-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'dynamfit'
  );
});

const uploadCsvName = computed(() => `${csvBaseName.value}_data.csv`);
const pronyCsvName = computed(() => `${csvBaseName.value}_prony.csv`);

const controlledTab = ref(dynamfitDomain.value === 'frequency' ? 'tab-home' : 'tab-temp-new');

const onTabChanged = (tabId: string): void => {
  activeTab.value = tabId;
  controlledTab.value = tabId;
};

const transformMethod = computed(() => store.getters['explorer/getDynamfitTransformMethod']);

watch(dynamfitData, (newVal, oldVal) => {
  const wasEmpty = !oldVal || !Object.keys(oldVal).length;
  const hasData = newVal && Object.keys(newVal).length > 0;
  // Cleared data means the session was reset (or the file changed): go back to
  // the first tab instead of leaving the last-viewed one selected.
  if (!hasData) {
    controlledTab.value = 'tab-home';
    activeTab.value = '';
    return;
  }

  if (wasEmpty) {
    controlledTab.value = dynamfitDomain.value === 'temperature' ? 'tab-temp-new' : 'tab-home';
  } else if (transformMethod.value && transformMethod.value !== 'none') {
    controlledTab.value = dynamfitDomain.value === 'frequency' ? 'tab-temp-new' : 'tab-home';
  }
});
</script>
