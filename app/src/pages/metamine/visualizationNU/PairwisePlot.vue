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
        <md-button @click.prevent="goHome">Go Home</md-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
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

const router = useRouter()
const store = useStore()

const windowWidth = ref<number>(window.innerWidth)

const isLoading = computed(() => {
  return store.getters['metamineNU/getLoadingState']
})

const isMiniDevice = computed(() => {
  return windowWidth.value <= 650
})

const goHome = () => {
  router.push('/mm')
}

const onResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  nextTick(() => {
    window.addEventListener('resize', onResize)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})
</script>
