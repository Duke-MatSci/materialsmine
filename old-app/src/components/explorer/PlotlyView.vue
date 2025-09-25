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
      },
      config: { responsive: true }
    }
  },
  mounted () {
    this.createPlot()
  },
  methods: {
    createPlot () {
      if (!this.isChartInvalid) return this.updatePlot()
      Plotly.newPlot(
        this.container,
        [],
        { ...this.layout },
        { ...this.config }
      )
    },
    updatePlot () {
      if (this.isChartInvalid) return this.createPlot()

      const { data = [], layout = {} } = this.chart
      Plotly.newPlot(
        this.container,
        data,
        { ...layout, ...this.layout },
        { ...this.config }
      )
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
      return !this.chart || !Object.keys(this.chart).length
    }
  }
}
</script>
