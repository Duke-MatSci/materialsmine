<template>
  <div class="main tool_page">
    <div class="md-layout md-alignment-top-left md-gutter adjust-padding" style="margin:10px">
      <div class="main-content" style="margin: 1rem; display: flex">
        <div class="scatter-chart" style="width: 50%">
          <Scatter />
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
import Scatter from './components/scatter-plot.vue'
import DataSelector from './components/data-selector.vue'
import RangeSelector from './components/range-selector.vue'
import Youngs from '@/pages/metamine/visualizationNU/components/youngs.vue'
import Poisson from '@/pages/metamine/visualizationNU/components/poisson.vue'
import Structure from '@/pages/metamine/visualizationNU/components/structure.vue'
import MaterialInformation from '@/pages/metamine/visualizationNU/components/material-information.vue'

export default {
  name: 'ScatterPage',
  components: {
    Scatter,
    DataSelector,
    RangeSelector,
    Youngs,
    Poisson,
    Structure,
    MaterialInformation
  }
}
</script>
