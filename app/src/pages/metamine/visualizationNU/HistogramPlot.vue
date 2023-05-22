<template>
  <div class="main tool_page">
    <div class="md-layout md-alignment-top-left md-gutter adjust-padding" style="margin:10px">
      <div class="main-content" style="margin: 1rem; display: flex">
        <div class="histogram-chart" style="width: 50%">
          <Histogram />
        </div>
        <div class="" style="width: 20%">
          <Structure />
          <Youngs />
          <Poisson />
        </div>
        <div class="" style="width: 30%;">
          <DataSelector />
          <RangeSelector />
          <MaterialInformation />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Histogram from './components/histogram.vue'
import DataSelector from './components/data-selector.vue'
import RangeSelector from './components/range-selector.vue'
import Youngs from '@/pages/metamine/visualizationNU/components/youngs.vue'
import Poisson from '@/pages/metamine/visualizationNU/components/poisson.vue'
import Structure from '@/pages/metamine/visualizationNU/components/structure.vue'
import MaterialInformation from '@/pages/metamine/visualizationNU/components/material-information.vue'

export default {
  name: 'HistogramPage',
  components: {
    Histogram,
    DataSelector,
    RangeSelector,
    Youngs,
    Poisson,
    Structure,
    MaterialInformation
  }
}
</script>
