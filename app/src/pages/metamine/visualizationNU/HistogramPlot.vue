<template>
    <div class="main tool_page">
        <div
            class="md-gutter adjust-padding wrapper-box"
            style="margin: 5px 0 0 5px"
        >
            <div class="md-layout-item">
                <button class="nuplot-button-link">
                    <router-link
                        to="/mm/metamaterial_visualization_nu"
                        style="color: #fff; font-weight: 700"
                    >
                        Visualize In Pairwise Plot
                    </router-link>
                </button>
            </div>
            <div class="main-content" style="margin: 1rem; display: flex">
                <div class="histogram-chart" style="width: 50%">
                    <Histogram />
                </div>
                <div class="subcharts" style="width: 20%">
                    <Structure />
                    <Youngs />
                    <Poisson />
                </div>
                <div class="side-tools" style="width: 30%">
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
    overflow: hidden;
}
</style>

<script>
import Histogram from './components/histogram.vue'
import DataSelector from './components/DataSelector.vue'
import RangeSelector from './components/RangeSelector.vue'
import Youngs from '@/pages/metamine/visualizationNU/components/youngs.vue'
import Poisson from '@/pages/metamine/visualizationNU/components/poisson.vue'
import Structure from '@/pages/metamine/visualizationNU/components/structure.vue'
import MaterialInformation from '@/pages/metamine/visualizationNU/components/MaterialInformation.vue'

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
