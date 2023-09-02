<template>
    <div ref="structurePlot"></div>
</template>

<script>
import * as d3 from 'd3'

const MARGIN = {
  TOP: 20,
  RIGHT: 20,
  BOTTOM: 20,
  LEFT: 20
}
const SIDE = 100
const WIDTH = SIDE - MARGIN.LEFT - MARGIN.RIGHT
const HEIGHT = SIDE - MARGIN.TOP - MARGIN.BOTTOM

export default {
  name: 'structure-knn-plot',
  props: ['dataPoint'],
  mounted () {
    this.createSvg(this.dataPoint)
  },
  methods: {
    createSvg (dataPoint) {
      const height = HEIGHT
      const width = WIDTH
      const marginLeft = MARGIN.LEFT
      const marginTop = MARGIN.TOP
      this.svg = d3
        .select(this.$refs.structurePlot)
        .append('svg')
        .attr('width', width + marginLeft * 2)
        .attr('height', height + marginTop * 2)
        .attr('viewBox', [
          0,
          0,
          width + marginLeft * 2,
          height + marginTop * 2
        ])
        .style('z-index', 10)
        .style('margin-top', '30px')
        .append('g')
        .attr('transform', `translate(${marginLeft}, ${marginTop})`)

      this.svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', 0 - marginTop / 2)
        .attr('text-anchor', 'middle')
        .style(
          'font-size',
          '8px'
        )
        .style('font-family', 'Arial, sans-serif')
        .text('Unit Cell Geometry')

      this.svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height + marginTop)
        .attr('class', 'volumn-ratio')
        .attr('text-anchor', 'middle')
        .style(
          'font-size',
          '8px'
        )
        .style('font-family', 'Arial, sans-serif')

      this.update(dataPoint)
    },

    update (dataPoint) {
      const data = dataPoint.geometry
      const color = dataPoint.outline_color
      const height = HEIGHT
      const width = WIDTH
      const marginLeft = MARGIN.LEFT

      let res = []
      res = this.pixelate(data, color)
      const yScale = d3.scaleLinear().domain([0, 50]).range([height, 0])

      const xScale = d3.scaleLinear().domain([0, 50]).range([0, width])

      const size = (width + marginLeft * 2) / 50
      const ratio = this.calculateRatio(data)
      this.svg.select('.volumn-ratio').text(`Volumn Ratio: ${ratio}`)

      const pixels = this.svg.selectAll('rect').data(res)
      pixels
        .enter()
        .append('rect')
        .merge(pixels)
        .attr('x', (d) => xScale(d.x))
        .attr('y', (d) => yScale(d.y))
        .attr('width', size)
        .attr('height', size)
        .attr('fill', (d) => d.fill)

      pixels.exit().remove()

      const tooltip = d3
        .select(this.$refs.structurePlot)
        .append('div')
        .attr('class', 'nuplot-tooltip')
        .style('background-color', 'white')
        .style('border', 'solid')
        .style('border-width', '1px')
        .style('border-radius', '5px')
        .style('padding', '10px')
        .style('visibility', 'hidden')
        .style('z-index', 100)

      const mouseover = function (event, d) {
        tooltip.style('visibility', 'visible')
      }
      const mousemove = function (event, d) {
        tooltip
          .html(`(${data.CM0 || 'N/A'}, ${data.CM1 || 'N/A'})`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
      }
      const mouseleave = function (event, d) {
        tooltip.style('visibility', 'hidden')
      }
      this.svg
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave)
    },

    calculateRatio (data) {
      if (!data) return 0
      let count1 = 0
      const xSquares = 50
      const ySquares = 50
      for (let i = 0; i < xSquares; i++) {
        for (let j = 0; j < ySquares; j++) {
          if (data[i * xSquares + j] === '1') count1++
        }
      }
      return (count1 / (xSquares * ySquares)).toFixed(2)
    },

    pixelate (data, color) {
      if (!data) return []
      const xSquares = 50
      const ySquares = 50
      const d = []
      for (let i = 0; i < xSquares; i++) {
        for (let j = 0; j < ySquares; j++) {
          d.push({
            x: i,
            y: j,
            fill: data[i * xSquares + j] === '0' ? 'white' : color
          })
        }
      }
      return d
    }
  }
}
</script>
