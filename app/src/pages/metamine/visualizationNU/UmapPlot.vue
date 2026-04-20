<template>
  <VisualizationLayout
    v-if="!isMiniDevice"
    class="u_toggle-display-off"
    :link="link"
    :dense="true"
  >
    <template #main_chart>
      <template v-if="!isLoading && showUmap">
        <Umap />
        <div class="tools-simulation u--layout-flex u--layout-flex-justify-sb">
          <md-switch v-model="enableKnn">Find Nearest Neighbors</md-switch>
          <dialog-box disableClose :active="dialogBoxActiveKnn">
            <template v-slot:content> <NeighborPanel /> </template>
            <template v-slot:actions>
              <md-button @click.prevent="closeDialogBox"
                >Close</md-button
              >
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
              <md-button @click.prevent="toggleDialogBoxSaveData"
                >Close</md-button
              >
            </template>
          </dialog-box>
          <button @click="handleReset" class="nuplot-button button-alert">
            Reset
          </button>
        </div>
      </template>
    </template>

    <template #subcharts>
      <Structure></Structure>
      <Youngs></Youngs>
      <Poisson></Poisson>
    </template>

    <template #side_tools>
      <DataSelector />
      <ParamSelector />
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
import Umap from '@/components/metamine/visualizationNU/umap.vue'
import DataSelector from '@/components/metamine/visualizationNU/DataSelector.vue'
import ParamSelector from '@/components/metamine/visualizationNU/ParamSelector.vue'
import Youngs from '@/components/metamine/visualizationNU/youngs.vue'
import Poisson from '@/components/metamine/visualizationNU/poisson.vue'
import Structure from '@/components/metamine/visualizationNU/structure.vue'
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
const showUmap = ref<boolean>(false)

const dialogBoxActiveKnn = computed(() => {
  return store.state.metamineNU.dialogBoxActiveKnn
})

const isLoading = computed(() => {
  return store.getters['metamineNU/getLoadingState']
})

const isMiniDevice = computed(() => {
  return windowWidth.value <= 650
})

const enableKnn = computed({
  get() {
    return store.state.metamineNU.enableKnn
  },
  set(value: boolean) {
    store.commit('metamineNU/updateEnableKnn', value)
  }
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
  // Note: This is done to introduce a custom delay in the rendering of the Umap
  // Change the showUmap to true after .5 sec
  setTimeout(() => {
    showUmap.value = true
  }, 300)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})
</script>
