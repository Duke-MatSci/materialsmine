<template>
    <div class="range-selector-wrapper">
        <div class="md-title u--font-emph-700">
            Property Range
        </div>
        <div class="slider" v-for="(name, index) in rangeList" :key="index">
            <div class="u--layout-flex u--layout-flex-justify-sb u_centralize_items">
                <div style="width: 20%">{{ name }}</div>
                <div style="width: 80%;">
                    <div class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__rel">
                        <input
                            class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__abs utility-transparentbg"
                            type="range"
                            v-bind:min="defaultValues[index][0]"
                            v-bind:max="defaultValues[index][1]"
                            step="1"
                            v-model="values[index][0]"
                            @change="handleMinSliderChangeFuncs($event, index)"
                        />
                        <input
                            class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__abs utility-transparentbg"
                            type="range"
                            v-bind:min="defaultValues[index][0]"
                            v-bind:max="defaultValues[index][1]"
                            step="1"
                            v-model="values[index][1]"
                            @change="handleMaxSliderChangeFuncs($event, index)"
                        />
                    </div>
                    <div class=" u--layout-flex u--layout-flex-justify-sb">
                        <div class="u--color-grey-sec">
                            {{ sigFigs(defaultValues[index][0], 4) }}
                        </div>
                        <div class="u--color-grey-sec">
                            {{ sigFigs(defaultValues[index][1], 4) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import sigFigs from '@/modules/metamine/utils/sigFigs'

const rangeList = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66']

export default {
  name: 'RangeSelector',
  computed: {
    ...mapState('metamineNU', {
      activeData: (state) => state.activeData,
      datasets: (state) => state.datasets,
      dataLibrary: (state) => state.dataLibrary
    }),
    defaultValues () {
      if (this.datasets.length > 0) {
        const range = this.rangeList.map((name) => [
          Math.min(...this.datasets.map((d) => d[name])),
          Math.max(...this.datasets.map((d) => d[name]))
        ])
        return range
      } else {
        const range = this.rangeList.map((name) => [0, 0])
        return range
      }
    },
    values () {
      if (this.activeData.length > 0) {
        return this.rangeList.map((name) => [
          Math.min(...this.activeData.map((d) => d[name])),
          Math.max(...this.activeData.map((d) => d[name]))
        ])
      } else {
        return this.rangeList.map((name) => [0, 0])
      }
    }
  },
  data () {
    return {
      rangeList: rangeList
    }
  },
  watch: {
    activeData: {
      handler () {},
      deep: true
    },
    dataLibrary: {
      handler () {},
      deep: true
    }
  },
  methods: {
    sigFigs,
    handleMinSliderChangeFuncs (event, index) {
      if (event.target.value > this.values[index][1]) {
        this.values[index][0] = this.values[index][1]
      }
      const activeDatasetNames = this.activeData.map((d) => d.name)
      const filteredDatasets = this.datasets.filter((d, i) => {
        const filtered =
                    d[this.rangeList[index]] >= this.values[index][0] &&
                    d[this.rangeList[index]] <= this.values[index][1] &&
                    activeDatasetNames.includes(d.name)
        return filtered
      })
      let sourceItems = this.dataLibrary
      const destItems = filteredDatasets
      const unselected = this.activeData.filter(
        (d) => !filteredDatasets.includes(d)
      )

      sourceItems = sourceItems.concat(unselected)
      this.$store.dispatch('metamineNU/setActiveData', destItems)
      this.$store.dispatch('metamineNU/setDataLibrary', sourceItems)
    },
    handleMaxSliderChangeFuncs (event, index) {
      if (event.target.value < this.values[index][0]) {
        this.values[index][1] = this.values[index][0]
      }
      const activeDatasetNames = this.activeData.map((d) => d.name)
      const filteredDatasets = this.datasets.filter((d, i) => {
        const filtered =
                    d[this.rangeList[index]] >= this.values[index][0] &&
                    d[this.rangeList[index]] <= this.values[index][1] &&
                    activeDatasetNames.includes(d.name)
        return filtered
      })
      let sourceItems = this.dataLibrary
      const destItems = filteredDatasets
      const unselected = this.activeData.filter(
        (d) => !filteredDatasets.includes(d)
      )

      sourceItems = sourceItems.concat(unselected)
      this.$store.dispatch('metamineNU/setActiveData', destItems)
      this.$store.dispatch('metamineNU/setDataLibrary', sourceItems)
    }
  }
}
</script>
