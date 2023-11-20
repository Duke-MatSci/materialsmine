<template>
  <VisualizationLayout :link="link" :dense="true">
    <template #main_chart>
      <Scatter />
      <div class="tools-simulation u--layout-flex u--layout-flex-justify-sb">
        <button @click="toggleDialogBoxKnn()" class="nuplot-button"> Find Nearest Neighbors</button>
        <dialog-box :active="dialogBoxActiveKnn" :disableClose="true">
            <template v-slot:content> <NeighborPanel /> </template>
            <template v-slot:actions>
                <md-button @click.native.prevent="toggleDialogBoxKnn" >Close</md-button>
            </template>
        </dialog-box>
        <button @click="toggleDialogBoxSaveData()" class="nuplot-button button-primary"> Save Data </button>
        <dialog-box :active="dialogBoxActiveSaveData" :disableClose="true">
            <template v-slot:content> <SaveDataPanel /> </template>
            <template v-slot:actions> <md-button @click.native.prevent="toggleDialogBoxSaveData">Close</md-button > </template>
        </dialog-box>
        <button @click="handleReset" class="nuplot-button button-alert">Reset</button>
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
  </VisualizationLayout>
</template>

<script>
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

export default {
  name: 'ScatterPage',
  components: {
    Scatter,
    DataSelector,
    RangeSelector,
    Youngs,
    Poisson,
    Structure,
    MaterialInformation,
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
      link: { to: '/mm/metamaterial_visualization_nu', text: 'Visualize In Pairwise Plot' }

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
      this.$store.dispatch('metamineNU/setReset', true, {
        root: true
      })
    }
  }
}
</script>
