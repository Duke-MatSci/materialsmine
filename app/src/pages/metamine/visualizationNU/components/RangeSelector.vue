<template>
  <div class="range-selector-wrapper">
    <div
      style="font-size: 20px; font-weight: bold; padding: 0px"
    >
      Property Range
    </div>
    <div class="slider" v-for="(name, index) in rangeList" :key="index">
      <div
        style="display: flex; justify-content: center; align-items: center"
      >
        <div style="width: 20%">{{ name }}</div>
        <div style="width: 80%">
          <div class="range-slider"> 
            <input class="range-slider" type="range" v-bind:min=defaultValues[index][0] v-bind:max=defaultValues[index][1] step="1" v-model="values[index][0]" @change="handleMinSliderChangeFuncs($event, index)">
            <input class="range-slider" type="range" v-bind:min=defaultValues[index][0] v-bind:max=defaultValues[index][1] step="1" v-model="values[index][1]" @change="handleMaxSliderChangeFuncs($event, index)">
          </div>
          <div style="display: flex; justify-content: space-between">
            <div style="color: gray">{{sigFigs(defaultValues[index][0], 4)}}</div>
            <div style="color: gray">{{sigFigs(defaultValues[index][1], 4)}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import { mapState } from 'vuex'
import sigFigs from '../utils/sigFigs'

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
    },
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
        const filtered = d[this.rangeList[index]] >= this.values[index][0] && d[this.rangeList[index]] <= this.values[index][1] && activeDatasetNames.includes(d.name)
        return filtered
      })
      let sourceItems = this.dataLibrary
      const destItems = filteredDatasets
      const unselected = this.activeData.filter((d) => !filteredDatasets.includes(d))

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
        const filtered = d[this.rangeList[index]] >= this.values[index][0] && d[this.rangeList[index]] <= this.values[index][1] && activeDatasetNames.includes(d.name)
        return filtered
      })
      let sourceItems = this.dataLibrary
      const destItems = filteredDatasets
      const unselected = this.activeData.filter((d) => !filteredDatasets.includes(d))

      sourceItems = sourceItems.concat(unselected)
      this.$store.dispatch('metamineNU/setActiveData', destItems)
      this.$store.dispatch('metamineNU/setDataLibrary', sourceItems)

    }
  }
}
</script>

<style scoped lang="scss">
  
.range-slider {
  margin: auto;
  text-align: center;
  position: relative;
  height: 3em;
}

.range-slider input[type=range] {
  position: absolute;
  left: 0;
  bottom: 0;
  background: transparent;
  pointer-events: none;
}

input[type=range] {
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 90%;
  
  &:nth-child(3){
    &::-webkit-slider-runnable-track{
      background-color: transparent;
    }
    &::-moz-range-track {
      background-color: transparent;
    }
  }
}

input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 5px;
  cursor: pointer;
  background: #2497e3;
  border-radius: 1px;
  border: 0;
}
input[type=range]::-webkit-slider-thumb {
  position: relative;
  border: 1px solid #2497e3;
  height: 18px;
  width: 18px;
  border-radius: 25px;
  background: #a1d0ff;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -7px;
  pointer-events: auto;
}

input[type=range]::-moz-range-track {
  width: 100%;
  height: 5px;
  cursor: pointer;
  background: #2497e3;
  border-radius: 1px;
  box-shadow: none;
  border: none;
}
input[type=range]::-moz-range-thumb {
  position: relative;
  border: 1px solid #2497e3;
  height: 18px;
  width: 18px;
  border-radius: 25px;
  background: #a1d0ff;
  cursor: pointer;

  -moz-appearance: none;
  pointer-events: auto;
}

</style>
