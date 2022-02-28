<template>
  <div class="smiles">
    <!--<CanvasWrapper ref="canvas-wrapper"></CanvasWrapper>-->
    <canvas :id="canvasId" ref="wrapped-canvas"></canvas>
  </div>
</template>
/*
  Uses code from: https://github.com/reymond-group/smilesDrawer
  TODO: overrides for theme and computeOnly do not seem to be working and removed from sample
*/
<script>
// import CanvasWrapper from './CanvasWrapper'
// eslint-disable-next-line no-unused-vars
import * as SmilesDrawer from 'smiles-drawer'
import _ from 'lodash'

export default {
  // components: {
  //   CanvasWrapper
  // },
  name: 'Smiles',
  props: {
    smilesOptions: {
      type: Object,
      default: () => {
        return {}
      }
    },
    smilesInput: {
      type: String,
      default: ''
    },
    formulaHandler: {
      type: Function,
      default: null
    },
    theme: {
      type: String,
      default: 'light'
    },
    computeOnly: {
      type: Boolean,
      default: false
    },
    onSuccessHandler: {
      type: Function,
      default: null
    },
    onErrorHandler: {
      type: Function,
      default: null
    }
  },
  data () {
    return {
      smilesOptionsAdjusted: null,
      smilesDrawer: null,
      smilesValue: '',
      smilesTheme: this.theme,
      smilesComputeOnly: this.computeOnly,
      provider: {
        context: null
      }
    }
  },

  watch: {
    smilesOptions: function (v) {
      const vm = this
      vm.overrideOptions(vm.smilesOptions)
    },
    smilesInput: function (v) {
      const vm = this
      // console.log('smiles input: ' + v)
      vm.smilesValue = v
      vm.setInput(v)
    },
    theme: function (v) {
      this.smilesTheme = v
    },
    computeOnly: function (v) {
      this.smilesComputeOnly = v
    }
  },
  computed: {
    canvasId () {
      return _.uniqueId('canvasId')
    }
  },
  mounted () {
    // console.log('canvas-id: ' + this.canvasId)
    this.overrideOptions(this.smilesOptions)
    this.smilesDrawer = new SmilesDrawer.Drawer(this.smilesOptionsAdjusted)
    this.provider.context = this.$refs['wrapped-canvas'].getContext('2d')
    this.adjustDimensions()
  },
  methods: {
    getMolecularFormula () {
      return this.smilesDrawer.getMolecularFormula()
    },
    overrideOptions (opts) {
      const vm = this
      const parentDims = this.getParentDimensions()
      if (opts) {
        vm.smilesOptionsAdjusted = _.clone(opts)
      } else {
        vm.smilesOptionsAdjusted = {}
      }
      vm.smilesOptionsAdjusted.height = parentDims.height
      vm.smilesOptionsAdjusted.width = parentDims.width
    },
    setInput (inputStr) {
      const vm = this
      if (inputStr) {
        vm.inputStr = inputStr
        SmilesDrawer.parse(vm.smilesValue, function (tree) {
          vm.smilesDrawer.draw(tree, vm.canvasId)
          if (vm.onSuccessHandler) {
            vm.onSuccessHandler()
          }
          if (vm.formulaHandler) {
            vm.formulaHandler(vm.getMolecularFormula())
          }
        }, function (err) {
          if (vm.formulaHandler) {
            vm.formulaHandler('*Error*')
          }
          if (vm.onErrorHandler) {
            vm.onErrorHandler(err)
          } else {
            // console.log('smilesDrawer error: ' + err)
          }
        })
      } else { // clear values on empty input
        if (vm.onSuccessHandler) {
          vm.onSuccessHandler()
        }
        if (vm.formulaHandler) {
          vm.formulaHandler('')
        }
        vm.clearCanvas() // clear the smiles image
      }
    },
    getParentDimensions () {
      return {
        width: this.$refs['wrapped-canvas'].parentElement.clientWidth,
        height: this.$refs['wrapped-canvas'].parentElement.clientHeight
      }
    },
    adjustDimensions () {
      const dim = this.getParentDimensions()
      this.$refs['wrapped-canvas'].width = dim.width
      this.$refs['wrapped-canvas'].height = dim.height
    },
    getCanvas () {
      return this.$refs['wrapped-canvas']
    },
    clearCanvas () {
      const c = this.$refs['wrapped-canvas']
      this.provider.context.clearRect(0, 0, c.width, c.height)
    }
  }

}
</script>

<style scoped>
  .smiles {
  }
  .canvas-wrapper {
    padding: 0;
    margin: 0;
  }
</style>
