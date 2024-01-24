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
            <md-button @click.native.prevent="closeDialogBox">Close</md-button>
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
            <md-button @click.native.prevent="toggleDialogBoxSaveData">
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
        <md-button @click.native.prevent="goHome">Go Home</md-button>
      </template>
    </dialog-box>
  </div>
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
import DataInfo from '@/components/metamine/visualizationNU/DataInfo.vue'
import { mapState } from 'vuex'

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
    VisualizationLayout,
    DataInfo
  },
  data () {
    return {
      dialogBoxActiveSaveData: false,
      reset: false,
      windowWidth: window.innerWidth,
      link: {
        to: '/mm/metamaterial_visualization_nu',
        text: 'Visualize In Pairwise Plot'
      }
    }
  },
  computed: {
    ...mapState('metamineNU', {
      dialogBoxActiveKnn: (state) => state.dialogBoxActiveKnn
    }),
    enableKnn: {
      get () {
        return this.$store.state.metamineNU.enableKnn
      },
      set (value) {
        this.$store.commit('metamineNU/updateEnableKnn', value)
      }
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
    closeDialogBox () {
      this.$store.commit('metamineNU/setDialogBoxActiveKnn', false)
    },
    toggleDialogBoxSaveData () {
      this.dialogBoxActiveSaveData = !this.dialogBoxActiveSaveData
    },
    handleReset () {
      this.$store.commit('metamineNU/setReset', true)
    },
    goHome () {
      this.$router.push('/mm')
    },
    onResize () {
      this.windowWidth = window.innerWidth
    }
  }
}
</script>
