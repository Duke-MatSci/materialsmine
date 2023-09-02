<template>
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
        <div class="main-content" style="margin: 3rem; display: flex">
            <div class="umap-chart" style="width: 50%">
                <Umap />
                <div
                    style="
                        display: flex;
                        justify-content: space-between;
                        margin-top: 40px;
                    "
                >
                    <button @click="toggleDialogBoxKnn()" class="nuplot-button">
                        Find Nearest Neighbors
                    </button>
                    <dialog-box
                        :active="dialogBoxActiveKnn"
                        :disableClose="true"
                    >
                        <template v-slot:content>
                            <NeighborPanel />
                        </template>
                        <template v-slot:actions>
                            <md-button
                                @click.native.prevent="toggleDialogBoxKnn"
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
                    <dialog-box
                        :active="dialogBoxActiveSaveData"
                        :disableClose="true"
                    >
                        <template v-slot:content>
                            <SaveDataPanel />
                        </template>
                        <template v-slot:actions>
                            <md-button
                                @click.native.prevent="toggleDialogBoxSaveData"
                                >Close</md-button
                            >
                        </template>
                    </dialog-box>
                    <button
                        @click="handleReset"
                        class="nuplot-button button-alert"
                    >
                        Reset
                    </button>
                </div>
            </div>
            <div class="subcharts" style="width: 20%">
                <Structure />
                <Youngs />
                <Poisson />
            </div>
            <div class="side-tools" style="width: 30%">
                <DataSelector />
                <ParamSelector />
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
import Umap from './components/umap.vue'
import DataSelector from './components/DataSelector.vue'
import ParamSelector from './components/ParamSelector.vue'
import Youngs from '@/pages/metamine/visualizationNU/components/youngs.vue'
import Poisson from '@/pages/metamine/visualizationNU/components/poisson.vue'
import Structure from '@/pages/metamine/visualizationNU/components/structure.vue'
import NeighborPanel from '@/pages/metamine/visualizationNU/components/NeighborPanel.vue'
import SaveDataPanel from './components/SaveDataPanel.vue'
import Dialog from '@/components/Dialog.vue'

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
    dialogBox: Dialog
  },
  data () {
    return {
      dialogBoxActiveKnn: false,
      dialogBoxActiveSaveData: false,
      reset: false
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
