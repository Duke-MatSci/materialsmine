<template>
  <VisualizationLayout :link="link" :dense="true">
    <template #main_chart>
      <Umap />
      <div class="tools-simulation u--layout-flex u--layout-flex-justify-sb">
        <button @click="toggleDialogBoxKnn()" class="nuplot-button">
          Find Nearest Neighbors
        </button>
        <dialog-box :active="dialogBoxActiveKnn" :disableClose="true">
          <template v-slot:content> <NeighborPanel /></template>
          <template v-slot:actions>
            <md-button @click.native.prevent="toggleDialogBoxKnn"
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
            <md-button @click.native.prevent="toggleDialogBoxSaveData"
              >Close</md-button
            >
          </template>
        </dialog-box>
        <button @click="handleReset" class="nuplot-button button-alert">
          Reset
        </button>
      </div>
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
  </VisualizationLayout>
</template>

<script>
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

export default {
  name: 'ScatterPage',
  components: {
    Umap,
    DataSelector,
    ParamSelector,
    Youngs,
    Poisson,
    Structure,
    NeighborPanel,
    SaveDataPanel,
    dialogBox: Dialog,
    VisualizationLayout
  },
  data () {
    return {
      dialogBoxActiveKnn: false,
      dialogBoxActiveSaveData: false,
      reset: false,
      link: {
        to: '/mm/metamaterial_visualization_nu',
        text: 'Visualize In Pairwise Plot'
      }
    }
  },
  methods: {
    toggleDialogBoxKnn () {
      this.dialogBoxActiveKnn = !this.dialogBoxActiveKnn
    },
    toggleDialogBoxSaveData () {
      this.dialogBoxActiveSaveData = !this.dialogBoxActiveSaveData
    },
    handleReset () {
      this.$store.commit('metamineNU/setReset', true)
    }
  }
}
</script>
