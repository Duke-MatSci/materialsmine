<template>
  <div class="range-selector-wrapper">
    <div
      style="font-size: 20px; font-weight: bold; padding: 0px"
    >
      Property Range
    </div>
    <div class="slider" v-for="(name, index) in rangeList" :key="index">
      <a-row
        type="flex"
        style="display: flex; justify-content: center; align-items: top"
      >
        <a-col :span="4">{{ name }}</a-col>
        <a-col :span="20">
          <a-slider
            range
            :value="values[index]"
            :default-value="defaultValues[index]"
            :min="defaultValues[index][0]"
            :max="defaultValues[index][1]"
            @change="handleSliderChangeFuncs[index]"
          >
          </a-slider>
          <a-row type='flex' style="justify-content: space-between">
            <a-col style="color: gray">{{sigFigs(defaultValues[index][0], 4)}}</a-col>
            <a-col style="color: gray">{{sigFigs(defaultValues[index][1], 4)}}</a-col>
          </a-row>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { Slider, Row, Col } from 'ant-design-vue'
import sigFigs from '../utils/sigFigs'

const rangeList = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66']

export default {
  name: 'RangeSelector',
  components: {
    'a-slider': Slider,
    'a-row': Row,
    'a-col': Col
  },
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
    },
    handleSliderChangeFuncs () {
      const self = this
      return this.rangeList.map((name, index) => {
        return function (value) {
          const activeDatasetNames = self.activeData.map((d) => d.name)
          const filteredDatasets = self.datasets.filter((d, i) => {
            const filtered = d[name] >= value[0] && d[name] <= value[1] && activeDatasetNames.includes(d.name)
            return filtered
          })
          let sourceItems = self.dataLibrary
          const destItems = filteredDatasets
          const unselected = self.activeData.filter((d) => !filteredDatasets.includes(d))

          sourceItems = sourceItems.concat(unselected)
          self.$store.dispatch('metamineNU/setActiveData', destItems)
          self.$store.dispatch('metamineNU/setDataLibrary', sourceItems)
        }
      })
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
    sigFigs: sigFigs
  }
}
</script>
