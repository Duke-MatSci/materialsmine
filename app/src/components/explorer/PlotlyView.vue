<template>
  <div ref="plotlyView"></div>
</template>
<script>
import Plotly from 'plotly.js/dist/plotly.min.js'

export default {
  name: 'PlotlyView',
  props: ['chart'],
  data () {
    return {
      layout: {
        width: this.generateWidth(),
        height: 360,
        margin: {
          b: 40,
          t: 40,
          l: 40,
          r: 40
        }
      }
    }
  },
  mounted () {
    this.createPlot()
  },
  methods: {
    createPlot () {
      var config = { responsive: true }
      Plotly.newPlot(this.container, [], { ...this.layout }, config)
    },
    updatePlot () {
      var config = { responsive: true }
      if (!this.isChartInvalid) {
        const { data = [], layout = {} } = this.chart
        Plotly.newPlot(
          this.container,
          data,
          { ...layout, ...this.layout },
          config
        )
      }
    },
    generateWidth () {
      const ww = window.innerWidth
      if (ww > 1280) return (ww * 2) / 3 - 100
      if (ww > 960) return (ww * 2) / 4 + 40
      if (ww < 960) return ww * 0.86
    }
  },
  watch: {
    chart: {
      handler: function () {
        this.updatePlot()
      },
      deep: true
    }
  },
  computed: {
    container () {
      return this.$refs.plotlyView
    },
    isChartInvalid () {
      return !this.chart
    }
  }
}
</script>
