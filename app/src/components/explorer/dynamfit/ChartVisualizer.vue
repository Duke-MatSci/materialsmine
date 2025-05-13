<template>
  <div class="u_width--max utility-bg_border-dark u--b-rad">
    <md-tabs
      :md-active-tab="
        dynamfitDomain === 'frequency' ? 'tab-home' : 'tab-temp-new'
      "
      class="form__stepper form__stepper-curate dialog-box_content u-reset-transform"
      md-dynamic-height
    >
      <md-tab id="tab-home" md-label="Complex, E*(iω)" class="u_relative">
        <PlotlyView :chart="dynamfitData['complex-chart']" key="1" />
        <div class="dynamfit-note" v-if="isTempData">
          <strong>Note:</strong> The viscoelastic response of untransformed data
          in the frequency domain.
        </div>
      </md-tab>
      <md-tab id="tab-exp" md-label="E'(ω), tan(δ)">
        <PlotlyView :chart="dynamfitData['complex-tand-chart']" key="2" />
      </md-tab>
      <md-tab id="tab-temp-new" md-label="Complex, E*(T)" class="u_relative">
        <PlotlyView :chart="dynamfitData['complex-temp-chart']" key="3" />
        <div class="dynamfit-note" v-if="isFrequencyData">
          <strong>Note:</strong> The viscoelastic response in the temperature
          domain of data transformed by TTSP given shift factors calculated via
          Williams-Landel-Ferry equation for universal amorphous constants
          C1=17.44, C2=51.6.
        </div>
      </md-tab>
      <md-tab id="tab-temp" md-label="E'(T), tan(δ)">
        <PlotlyView :chart="dynamfitData['temp-tand-chart']" key="4" />
      </md-tab>
      <md-tab id="tab-relax" md-label="Relaxation, E(t)">
        <PlotlyView :chart="dynamfitData['relaxation-chart']" key="5" />
      </md-tab>
      <md-tab id="tab-spec" md-label="R Spectrum, H(𝜏)">
        <PlotlyView
          :chart="dynamfitData['relaxation-spectrum-chart']"
          key="6"
        />
      </md-tab>
      <md-tab id="tab-upload" md-label="Uploaded Data">
        <TableComponent :tableData="upload" sortBy="i" />
      </md-tab>
      <md-tab id="tab-Prony" md-label="Prony Coeff">
        <TableComponent :tableData="prony" sortBy="i" />

        <download-csv :data="prony" name="fit_coef.csv">
          <button
            :disabled="!prony.length"
            class="md-button btn btn--primary u--b-rad"
          >
            Download Coefficients
          </button>
        </download-csv>
      </md-tab>
    </md-tabs>
  </div>
</template>
<script>
import PlotlyView from '@/components/explorer/PlotlyView.vue';
import TableComponent from '@/components/explorer/TableComponent.vue';
import JsonCSV from 'vue-json-csv';

import { mapGetters, mapState } from 'vuex';

export default {
  name: 'ChartVisualizer',
  components: {
    PlotlyView,
    TableComponent,
    downloadCsv: JsonCSV
  },
  computed: {
    ...mapGetters({
      dynamfitData: 'explorer/getDynamfitData',
      dynamfitDomain: 'explorer/getDynamfitDomain'
    }),
    ...mapState({
      prony: (state) => state.explorer.dynamfitData?.mytable ?? [],
      upload: (state) => state.explorer.dynamfitData?.['upload-data'] ?? []
    }),
    isFrequencyData() {
      return (
        this.dynamfitDomain === 'frequency' &&
        this.dynamfitData['complex-chart']
      );
    },
    isTempData() {
      return (
        this.dynamfitDomain === 'temperature' &&
        this.dynamfitData['complex-temp-chart']
      );
    }
  },
  // Vue 2 watch dynamfitData and console log it both old and new values
  watch: {
    dynamfitData: {
      handler(newVal, oldVal) {
        console.log('New Value:', newVal);
        console.log('Old Value:', oldVal);
      },
      deep: true,
      immediate: true
    }
  }
};
</script>
