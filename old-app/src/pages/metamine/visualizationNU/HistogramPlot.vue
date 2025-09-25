<template>
  <VisualizationLayout
    v-if="!isMiniDevice"
    class="u_toggle-display-off"
    :link="{
      to: '/mm/metamaterial_visualization_nu',
      text: 'Visualize In Pairwise Plot'
    }"
  >
    <template #main_chart> <Histogram /> </template>

    <template #side_tools>
      <DataSelector />
      <RangeSelector />
      <MaterialInformation />
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
import Histogram from '@/components/metamine/visualizationNU/histogram.vue'
import DataSelector from '@/components/metamine/visualizationNU/DataSelector.vue'
import RangeSelector from '@/components/metamine/visualizationNU/RangeSelector.vue'
import MaterialInformation from '@/components/metamine/visualizationNU/MaterialInformation.vue'
import VisualizationLayout from '@/components/metamine/visualizationNU/VisualizationLayout.vue'
import DataInfo from '@/components/metamine/visualizationNU/DataInfo.vue'
import Dialog from '@/components/Dialog.vue'

export default {
  name: 'HistogramPage',
  components: {
    Histogram,
    DataSelector,
    RangeSelector,
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
