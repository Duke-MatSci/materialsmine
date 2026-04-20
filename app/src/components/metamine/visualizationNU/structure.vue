<template>
  <div ref="structurePlot"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import * as d3 from 'd3'

const MARGIN = {
  TOP: 30,
  RIGHT: 30,
  BOTTOM: 30,
  LEFT: 30
}
const SIDE = 230
const WIDTH = SIDE - MARGIN.LEFT - MARGIN.RIGHT
const HEIGHT = SIDE - MARGIN.TOP - MARGIN.BOTTOM

interface PixelData {
  x: number
  y: number
  fill: string
}

const store = useStore()
const structurePlot = ref<HTMLElement | null>(null)

const svg = ref<any>(null)

const dataPoint = computed(() => store.state.metamineNU.dataPoint)

function calculateRatio(data: string): number {
  if (!data) return 0
  let count1 = 0
  const xSquares = 50
  const ySquares = 50
  for (let i = 0; i < xSquares; i++) {
    for (let j = 0; j < ySquares; j++) {
      if (data[i * xSquares + j] === '1') count1++
    }
  }
  return parseFloat((count1 / (xSquares * ySquares)).toFixed(2))
}

function pixelate(data: string, color: string): PixelData[] {
  if (!data) return []
  const xSquares = 50
  const ySquares = 50
  const d: PixelData[] = []
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

function createSvg(dataPointValue: any) {
  const height = dataPointValue.height ? dataPointValue.height : HEIGHT
  const width = dataPointValue.width ? dataPointValue.width : WIDTH
  const marginLeft = dataPointValue.marginLeft
    ? dataPointValue.marginLeft
    : MARGIN.LEFT
  const marginTop = dataPointValue.marginTop ? dataPointValue.marginTop : MARGIN.TOP
  svg.value = d3
    .select(structurePlot.value)
    .append('svg')
    .attr('width', width + marginLeft * 2)
    .attr('height', height + marginTop * 2)
    .attr('viewBox', [0, 0, width + marginLeft * 2, height + marginTop * 2])
    .style('z-index', 10)
    .style('margin-bottom', '20px')
    .style('padding-bottom', '10px')
    .append('g')
    .attr('transform', `translate(${marginLeft}, ${marginTop})`)

  svg.value
    .append('text')
    .attr('x', width / 2)
    .attr('y', 0 - marginTop / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', dataPointValue.fontSize ? dataPointValue.fontSize : '16px')
    .style('font-family', 'Arial, sans-serif')
    .text('Unit Cell Geometry')

  svg.value
    .append('text')
    .attr('x', width / 2)
    .attr('y', height + marginTop)
    .attr('class', 'volumn-ratio')
    .attr('text-anchor', 'middle')
    .style('font-size', dataPointValue.fontSize ? dataPointValue.fontSize : '16px')
    .style('font-family', 'Arial, sans-serif')

  update(dataPointValue)
}

function update(dataPointValue: any) {
  const data = dataPointValue.geometry
  const color = dataPointValue.outline_color
  const height = dataPointValue.height ? dataPointValue.height : HEIGHT
  const width = dataPointValue.width ? dataPointValue.width : WIDTH
  const marginLeft = dataPointValue.marginLeft
    ? dataPointValue.marginLeft
    : MARGIN.LEFT

  let res: PixelData[] = []
  res = pixelate(data, color)
  const yScale = d3.scaleLinear().domain([0, 50]).range([height, 0])

  const xScale = d3.scaleLinear().domain([0, 50]).range([0, width])

  const size = (width + marginLeft * 2) / 50
  const ratio = calculateRatio(data)
  svg.value.select('.volumn-ratio').text(`Volumn Ratio: ${ratio}`)

  const pixels = svg.value.selectAll('rect').data(res)
  pixels
    .enter()
    .append('rect')
    .merge(pixels)
    .attr('x', (d: PixelData) => xScale(d.x))
    .attr('y', (d: PixelData) => yScale(d.y))
    .attr('width', size)
    .attr('height', size)
    .attr('fill', (d: PixelData) => d.fill)

  pixels.exit().remove()

  const tooltip = d3
    .select(structurePlot.value)
    .append('div')
    .attr('class', 'nuplot-tooltip')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '1px')
    .style('border-radius', '5px')
    .style('padding', '10px')
    .style('visibility', 'hidden')
    .style('z-index', 100)

  const mouseover = function (event: any, d: any) {
    tooltip.style('visibility', 'visible')
  }
  const mousemove = function (event: any, d: any) {
    tooltip
      .html(`(${data.CM0 || 'N/A'}, ${data.CM1 || 'N/A'})`)
      .style('left', event.pageX + 10 + 'px')
      .style('top', event.pageY + 10 + 'px')
  }
  const mouseleave = function (event: any, d: any) {
    tooltip.style('visibility', 'hidden')
  }
  svg.value
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseleave', mouseleave)
}

onMounted(() => {
  createSvg(dataPoint.value)
})

watch(
  dataPoint,
  (val, oldVal) => {
    if (svg.value) {
      update(val)
    }
  },
  { deep: true }
)
</script>
