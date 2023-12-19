<template>
  <VisualizationLayout
    :link="{
      to: '/mm/metamaterial_visualization_nu/umap',
      text: 'Visualize In Reduced Dimension'
    }"
  >
    <template #main_chart> <PairwisePlot></PairwisePlot> </template>

    <template #subcharts>
      <Structure></Structure>
      <Youngs></Youngs>
      <Poisson></Poisson>
    </template>

    <template #side_tools>
      <DataSelector></DataSelector>
      <RangeSelector></RangeSelector>
      <MaterialInformation></MaterialInformation>
    </template>

    <template #footer>
      <DataInfo />
    </template>
  </VisualizationLayout>
</template>

<script>
import PairwisePlot from '@/components/metamine/visualizationNU/pairwise.vue'
import DataSelector from '@/components/metamine/visualizationNU/DataSelector.vue'
import RangeSelector from '@/components/metamine/visualizationNU/RangeSelector.vue'
import Youngs from '@/components/metamine/visualizationNU/youngs.vue'
import Poisson from '@/components/metamine/visualizationNU/poisson.vue'
import Structure from '@/components/metamine/visualizationNU/structure.vue'
import MaterialInformation from '@/components/metamine/visualizationNU/MaterialInformation.vue'
import VisualizationLayout from '@/components/metamine/visualizationNU/VisualizationLayout.vue'
import DataInfo from '@/components/metamine/visualizationNU/DataInfo.vue'

export default {
  name: 'PairwisePlotPage',
  components: {
    PairwisePlot,
    DataSelector,
    RangeSelector,
    Youngs,
    Poisson,
    Structure,
    MaterialInformation,
    DataInfo,
    VisualizationLayout
  }
}
</script>
