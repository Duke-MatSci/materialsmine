<template>
    <div class="wrapper-box md-gutter adjust-padding" style="margin:5px 0 0 5px">
      <div class="md-layout-item">
        <button class="nuplot-button-link">
          <router-link to="/mm/metamaterial_visualization_nu/umap" style="color: #fff; font-weight: 700;">
          Visualize In Reduced Dimension
        </router-link>
        </button>
      </div>
      <div class="main-content" style="margin: 1rem; display: flex">
        <div class="pairwise-plot-chart" style="width: 45%">
          <PairwisePlot></PairwisePlot>
        </div>
        <div class="subcharts" style="width: 20%">
          <Structure></Structure>
          <Youngs></Youngs>
          <Poisson></Poisson>
        </div>
        <div class="side-tools" style="width: 35%">
          <DataSelector></DataSelector>
          <RangeSelector></RangeSelector>
          <MaterialInformation></MaterialInformation>
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
import PairwisePlot from './components/pairwise.vue'
import DataSelector from './components/DataSelector.vue'
import RangeSelector from './components/RangeSelector.vue'
import Youngs from '@/pages/metamine/visualizationNU/components/youngs.vue'
import Poisson from '@/pages/metamine/visualizationNU/components/poisson.vue'
import Structure from '@/pages/metamine/visualizationNU/components/structure.vue'
import MaterialInformation from '@/pages/metamine/visualizationNU/components/MaterialInformation.vue'

export default {
  name: 'PairwisePlotPage',
  components: {
    PairwisePlot,
    DataSelector,
    RangeSelector,
    Youngs,
    Poisson,
    Structure,
    MaterialInformation
  }
}
</script>
