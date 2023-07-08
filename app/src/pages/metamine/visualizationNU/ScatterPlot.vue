<template>
  <div class="main tool_page wrapper-box">
    <div class="md-layout md-alignment-top-left md-gutter adjust-padding" style="margin:10px">
      <div class="main-content" style="margin: 1rem; display: flex">
        <div class="scatter-chart" style="width: 50%">
          <Scatter />
        </div>
        <div class="subcharts" style="width: 20%">
          <Structure />
          <Youngs />
          <Poisson />
        </div>
        <div class="side-tools" style="width: 30%;">
          <DataSelector />
          <RangeSelector />
          <MaterialInformation />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.subcharts {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 18%;
  overflow: hidden;
}
</style>

<script>
import Scatter from './components/scatter.vue'
import DataSelector from './components/DataSelector.vue'
import RangeSelector from './components/RangeSelector.vue'
import Youngs from '@/pages/metamine/visualizationNU/components/youngs.vue'
import Poisson from '@/pages/metamine/visualizationNU/components/poisson.vue'
import Structure from '@/pages/metamine/visualizationNU/components/structure.vue'
import MaterialInformation from '@/pages/metamine/visualizationNU/components/MaterialInformation.vue'

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
