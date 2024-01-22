<template>
  <VisualizationLayout
    v-if="!isMiniDevice"
    class="u_toggle-display-off"
    :link="{
      to: '/mm/metamaterial_visualization_nu/umap',
      text: 'Visualize In Reduced Dimension'
    }"
  >
    <template #main_chart>
      <PairwisePlot v-if="!isLoading" />
    </template>

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
  <div v-else class="footer_content-mobile">
    <Dialog disableClose :minWidth="40" :active="isMiniDevice">
      <template v-slot:title>Metamine Information</template>
      <template v-slot:content
        >Metamine Charts and Visualization data are accessible only on large
        screen devices.</template
      >
      <template v-slot:actions>
        <md-button @click.native.prevent="goHome">Go Home</md-button>
      </template>
    </Dialog>
  </div>
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
import Dialog from '@/components/Dialog.vue'

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
    VisualizationLayout,
    Dialog
  },
  data () {
    return {
      windowWidth: window.innerWidth
    }
  },
  computed: {
    isLoading () {
      return this.$store.getters['metamineNU/getLoadingState']
    },
    isMiniDevice () {
      return this.windowWidth <= 650
    }
  },
  mounted () {
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize)
    })
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    goHome () {
      this.$router.push('/mm')
    },
    onResize () {
      this.windowWidth = window.innerWidth
    }
  }
}
</script>
