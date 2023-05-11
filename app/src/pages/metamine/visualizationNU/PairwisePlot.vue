<template>
  <div class="main tool_page">
    <div class="md-layout md-alignment-top-left md-gutter adjust-padding">
      <div class="md-layout-item md-size-100">
        <h2>Material Data Explorer (Pairwise)</h2>
      </div>
      <div class="main-content" style="margin: 1rem; display: flex">
        <div class="pairwise-plot-chart" style="width: 50%">
          <PairwisePlot />
        </div>
        <div class="" style="width: 20%">
          <Structure />
          <Youngs />
          <Poisson />
        </div>
        <div class="" style="width: 30%; border: 1px solid green; height: 90vh">
          <DataSelector />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PairwisePlot from './components/pairwise-plot.vue'
import DataSelector from './components/data-selector.vue'
import Youngs from '@/pages/metamine/visualizationNU/components/youngs.vue'
import Poisson from '@/pages/metamine/visualizationNU/components/poisson.vue'
import Structure from '@/pages/metamine/visualizationNU/components/structure.vue'

export default {
  name: 'PairwisePlotPage',
  components: {
    PairwisePlot,
    DataSelector,
    Youngs,
    Poisson,
    Structure
  }
}
</script>
