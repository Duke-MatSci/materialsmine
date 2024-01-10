<template>
  <div class="u_width--max utility-bg_border-dark u--b-rad">
    <md-tabs
      class="form__stepper form__stepper-curate dialog-box_content"
      md-dynamic-height
    >
      <md-tab id="tab-home" md-label="Complex, E*(iω)">
        <PlotlyView :chart="dynamfitData['complex-chart']" key="1" />
      </md-tab>
      <md-tab id="tab-exp" md-label="E'(ω), tan(δ)">
        <PlotlyView :chart="dynamfitData['complex-tand-chart']" key="2" />
      </md-tab>
      <md-tab id="tab-relax" md-label="Relaxation, E(t)">
        <PlotlyView :chart="dynamfitData['relaxation-chart']" key="3" />
      </md-tab>
      <md-tab id="tab-spec" md-label="R Spectrum, H(t)">
        <PlotlyView
          :chart="dynamfitData['relaxation-spectrum-chart']"
          key="4"
        />
      </md-tab>
      <md-tab id="tab-upload" md-label="Upload Data">
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
import PlotlyView from '@/components/explorer/PlotlyView.vue'
import TableComponent from '@/components/explorer/TableComponent.vue'
import JsonCSV from 'vue-json-csv'

import { mapGetters, mapState } from 'vuex'

export default {
  name: 'ChartVisualizer',
  components: {
    PlotlyView,
    TableComponent,
    downloadCsv: JsonCSV
  },
  computed: {
    ...mapGetters({
      dynamfitData: 'explorer/getDynamfitData'
    }),
    ...mapState({
      prony: (state) => state.explorer.dynamfitData?.mytable ?? [],
      upload: (state) => state.explorer.dynamfitData?.['upload-data'] ?? []
    })
  }
}
</script>
