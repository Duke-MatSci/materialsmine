<template>
  <VisualizationLayout
    v-if="!isMiniDevice"
    class="u_toggle-display-off"
    :link="link"
    :dense="true"
  >
    <template #main_chart>
      <Scatter />
      <div class="tools-simulation u--layout-flex u--layout-flex-justify-sb">
        <md-switch v-model="enableKnn">Find Nearest Neighbors</md-switch>
        <dialog-box disableClose :active="dialogBoxActiveKnn">
          <template v-slot:content> <NeighborPanel /> </template>
          <template v-slot:actions>
            <md-button @click.prevent="closeDialogBox">Close</md-button>
          </template>
        </dialog-box>
        <button
          @click="toggleDialogBoxSaveData()"
          class="nuplot-button button-primary"
        >
          Save Data
        </button>
        <dialog-box :active="dialogBoxActiveSaveData" :disableClose="true">
          <template v-slot:content> <SaveDataPanel /> </template>
          <template v-slot:actions>
            <md-button @click.prevent="toggleDialogBoxSaveData">
              Close
            </md-button>
          </template>
        </dialog-box>
        <button @click="handleReset" class="nuplot-button button-alert">
          Reset
        </button>
      </div>
    </template>

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

    <template #footer>
      <DataInfo />
    </template>
  </VisualizationLayout>

  <div v-else class="footer_content-mobile">
    <dialog-box disableClose :minWidth="40" :active="isMiniDevice">
      <template v-slot:title>Metamine Information</template>
      <template v-slot:content
        >Metamine Charts and Visualization data are accessible only on large
        screen devices.</template
      >
      <template v-slot:actions>
        <md-button @click.prevent="goHome">Go Home</md-button>
      </template>
    </dialog-box>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import Scatter from '@/components/metamine/visualizationNU/scatter.vue'
import DataSelector from '@/components/metamine/visualizationNU/DataSelector.vue'
import RangeSelector from '@/components/metamine/visualizationNU/RangeSelector.vue'
import Youngs from '@/components/metamine/visualizationNU/youngs.vue'
import Poisson from '@/components/metamine/visualizationNU/poisson.vue'
import Structure from '@/components/metamine/visualizationNU/structure.vue'
import MaterialInformation from '@/components/metamine/visualizationNU/MaterialInformation.vue'
import NeighborPanel from '@/components/metamine/visualizationNU/NeighborPanel.vue'
import SaveDataPanel from '@/components/metamine/visualizationNU/SaveDataPanel.vue'
import Dialog from '@/components/Dialog.vue'
import VisualizationLayout from '@/components/metamine/visualizationNU/VisualizationLayout.vue'
import DataInfo from '@/components/metamine/visualizationNU/DataInfo.vue'

const router = useRouter()
const store = useStore()

const dialogBoxActiveSaveData = ref<boolean>(false)
const reset = ref<boolean>(false)
const windowWidth = ref<number>(window.innerWidth)
const link = ref({
  to: '/mm/metamaterial_visualization_nu',
  text: 'Visualize In Pairwise Plot'
})

const dialogBoxActiveKnn = computed(() => {
  return store.state.metamineNU.dialogBoxActiveKnn
})

const enableKnn = computed({
  get() {
    return store.state.metamineNU.enableKnn
  },
  set(value: boolean) {
    store.commit('metamineNU/updateEnableKnn', value)
  }
})

const isMiniDevice = computed(() => {
  return windowWidth.value <= 650
})

const closeDialogBox = () => {
  store.commit('metamineNU/setDialogBoxActiveKnn', false)
}

const toggleDialogBoxSaveData = () => {
  dialogBoxActiveSaveData.value = !dialogBoxActiveSaveData.value
}

const handleReset = () => {
  store.commit('metamineNU/setReset', true)
}

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
