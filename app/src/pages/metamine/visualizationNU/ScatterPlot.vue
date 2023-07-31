<template>
    <div class="md-gutter adjust-padding wrapper-box">
      <div class="main-content" style="margin: 3rem; display: flex">
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
</template>

<style scoped>
.subcharts {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
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
