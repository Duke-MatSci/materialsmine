<template>
  <VisualizationLayout :link="{to: '/mm/metamaterial_visualization_nu', text: 'Visualize In Pairwise Plot'}">
    <template #main_chart> <Histogram /> </template>

    <template #subcharts>
      <Structure />
      <Youngs />
      <Poisson />
    </template>

    <template #side_tools>
      <DataSelector />
      <RangeSelector />
      <MaterialInformation />
    </template>
  </VisualizationLayout>
</template>

<script>
import Histogram from '@/components/metamine/visualizationNU/histogram.vue'
import DataSelector from '@/components/metamine/visualizationNU/DataSelector.vue'
import RangeSelector from '@/components/metamine/visualizationNU/RangeSelector.vue'
import Youngs from '@/components/metamine/visualizationNU/youngs.vue'
import Poisson from '@/components/metamine/visualizationNU/poisson.vue'
import Structure from '@/components/metamine/visualizationNU/structure.vue'
import MaterialInformation from '@/components/metamine/visualizationNU/MaterialInformation.vue'
import VisualizationLayout from '@/components/metamine/visualizationNU/VisualizationLayout.vue'

export default {
  name: 'HistogramPage',
  components: {
    Histogram,
    DataSelector,
    RangeSelector,
    Youngs,
    Poisson,
    Structure,
    MaterialInformation,
    VisualizationLayout
  }
}
</script>
