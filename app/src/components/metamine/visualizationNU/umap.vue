<template>
  <div ref="umapPlot"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import * as d3 from 'd3'
import { StandardScaler } from '@/modules/metamine/utils/standardScaler'
import { UMAP } from 'umap-js'
import { organizeByName } from '@/modules/metamine/utils/organizeByName'
import { nnColorAssignment } from '@/components/metamine/visualizationNU/constants'

const circleOriginalSize = 5
const circleFocusSize = 8

const MARGIN = {
  TOP: 0,
  RIGHT: 50,
  BOTTOM: 20,
  LEFT: 50
}

const SIDE_BAR_SIZE = 100

const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT - SIDE_BAR_SIZE
const HEIGHT = 700 - MARGIN.TOP - MARGIN.BOTTOM - SIDE_BAR_SIZE

interface ChartData {
  chart: boolean
  svg?: any
  xLabel?: any
  yLabel?: any
  xAxisGroup?: any
  yAxisGroup?: any
  xScaleForBrush?: any
  yScaleForBrush?: any
}

const store = useStore()
const umapPlot = ref<HTMLElement | null>(null)

const chartData = ref<ChartData>({
  chart: false,
  xScaleForBrush: null,
  yScaleForBrush: null
})

const activeData = computed(() => store.state.metamineNU.activeData)
const dataPoint = computed(() => store.state.metamineNU.dataPoint)
const selectedData = computed(() => store.state.metamineNU.selectedData)
const reset = computed(() => store.state.metamineNU.reset)
const knnUmap = computed(() => store.state.metamineNU.knnUmap)
const enableKnn = computed(() => store.state.metamineNU.enableKnn)

function expo(x: number, f: number): string | number {
  if (x < 1000 && x > -1000) return x
  return Number(x).toExponential(f)
}

function isBrushed(brushCoords: [[number, number], [number, number]], cx: number, cy: number): boolean {
  const x0 = brushCoords[0][0]
  const x1 = brushCoords[1][0]
  const y0 = brushCoords[0][1]
  const y1 = brushCoords[1][1]
  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1
}

function createSvg({ container }: { container: HTMLElement }) {
  chartData.value.svg = d3
    .select(container)
    .append('svg')
    .attr('width', WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
    .attr('height', HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)
    .attr('viewBox', [
      -MARGIN.LEFT,
      -MARGIN.TOP,
      WIDTH + MARGIN.LEFT + MARGIN.RIGHT,
      HEIGHT + MARGIN.TOP + MARGIN.BOTTOM
    ])
    .attr('style', 'max-width: 100%;')

  // brush
  chartData.value.svg.append('g').attr('class', 'brush')

  // Labels
  chartData.value.xLabel = chartData.value.svg
    .append('text')
    .attr('x', WIDTH / 2)
    .attr('y', HEIGHT + 50)
    .attr('text-anchor', 'middle')
    .style('fill', 'black')

  chartData.value.yLabel = chartData.value.svg
    .append('text')
    .attr('x', -HEIGHT / 2)
    .attr('y', -60)
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .style('fill', 'black')
  // Append group el to display both axes
  chartData.value.xAxisGroup = chartData.value.svg
    .append('g')
    .attr('transform', `translate(0, ${HEIGHT})`)

  // Append group el to display both axes
  chartData.value.yAxisGroup = chartData.value.svg.append('g')

  chartData.value.chart = true

  chartData.value.xScaleForBrush = null
  chartData.value.yScaleForBrush = null
}

function update({ container }: { container: HTMLElement }) {
  const data = activeData.value
  const datasets: any[] = []
  const query1 = 'X'
  const query2 = 'Y'
  const properties = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66']
  const scaler = new StandardScaler()
  const enableKnnValue = enableKnn.value

  const organizedData = organizeByName(data)
  const umap = new UMAP({
    nNeighbors: knnUmap.value || 15
  })
  let tempData: number[][] = []
  organizedData.forEach((d: any) => {
    let tempData2: number[][] = []
    d.data.forEach((data: any) => {
      const tempProperties = properties.map((p) => +data[p])
      tempData.push(tempProperties)
      tempData2.push(tempProperties)
    })

    if (tempData.length) {
      tempData = scaler.fitTransform(tempData)
      umap.fit(tempData)
    }

    tempData2 = scaler.transform(tempData2)
    const res = tempData2.length ? umap.transform(tempData2) : null

    if (res) {
      res.forEach((p: number[], i: number) => {
        d.data[i].X = p[0]
        d.data[i].Y = p[1]
      })
    }
    datasets.push(d.data)
  })
  const finalData = datasets.flat()

  // remove elements to avoid repeated append
  d3.select('.nuplot-tooltip').remove()
  d3.selectAll('.dataCircle').remove()
  d3.selectAll('defs').remove()
  d3.selectAll('.clipPath').remove()

  const yScale = d3
    .scaleLinear()
    .domain([
      d3.min(finalData, (d: any) => d[query2]),
      d3.max(finalData, (d: any) => d[query2])
    ])
    .range([HEIGHT, 0])

  const xScale = d3
    .scaleLinear()
    .domain([
      d3.min(finalData, (d: any) => d[query1]),
      d3.max(finalData, (d: any) => d[query1])
    ])
    .range([0, WIDTH])

  chartData.value.xScaleForBrush = xScale
  chartData.value.yScaleForBrush = yScale

  // Add a clipPath: everything out of this area won't be drawn.
  chartData.value.svg
    .append('defs')
    .append('SVG:clipPath')
    .attr('id', 'clip')
    .append('SVG:rect')
    .attr('width', WIDTH)
    .attr('height', HEIGHT)
    .attr('x', 0)
    .attr('y', 0)

  const xAxisCall = d3
    .axisBottom(xScale)
    .tickFormat((x: any) => `${expo(x, 2)}`)
  chartData.value.xAxisGroup.transition().duration(500).call(xAxisCall)

  const yAxisCall = d3.axisLeft(yScale).tickFormat((y: any) => `${expo(y, 2)}`)
  chartData.value.yAxisGroup.transition().duration(500).call(yAxisCall)
  chartData.value.xLabel.text(query1)
  chartData.value.yLabel.text(query2)

  const tooltip = d3
    .select(container)
    .append('div')
    .attr('class', 'nuplot-tooltip')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '1px')
    .style('border-radius', '5px')
    .style('padding', '10px')
    .style('visibility', 'hidden')
    .style('z-index', 100)
  const mouseover = function (e: any, d: any) {
    d3.select(this)
      .attr('r', circleFocusSize)
      .style('stroke', 'black')
      .style('stroke-width', 2)
      .style('fill-opacity', 1)
    store.commit('metamineNU/setDataPoint', d)
    tooltip.style('visibility', 'visible').transition().duration(200)
  }

  const mousemove = function (e: any, d: any) {
    tooltip
      .html(
        'Dataset: ' +
          d.name +
          '<br>symmetry: ' +
          d.symmetry +
          '<br>C11: ' +
          d.C11 +
          '<br>C12: ' +
          d.C12 +
          '<br>C22: ' +
          d.C22 +
          '<br>C16: ' +
          d.C16 +
          '<br>C26: ' +
          d.C26 +
          '<br>C66: ' +
          d.C66
      )
      .style('top', e.pageY + 10 + 'px')
      .style('left', e.pageX + 10 + 'px')
  }

  const mouseleave = function (e: any, d: any) {
    tooltip.style('visibility', 'hidden').transition().duration(200)
    const circle = d3.select(this)
    d3.select(this)
      .attr(
        'r',
        circle.classed('scatter-highlighted')
          ? circleFocusSize
          : circleOriginalSize
      )
      .style('stroke', 'none')
      .style('stroke-width', 2)
      .style('fill-opacity', 0.8)
  }

  const mousedown = function (e: any, d: any) {
    const inputData = ['X', 'Y'].map((c) => d[c])
    const target = d3.select(this)
    target.classed('nuplot-selected', !target.classed('nuplot-selected'))

    const selected: any[] = []
    d3.selectAll('.nuplot-selected').each((d: any, i: number) => selected.push(d))
    store.commit('metamineNU/setSelectedData', selected)

    target.classed('nuplot-selected', true)
    if (enableKnnValue) {
      getKnnData(inputData, finalData).then((res) => {
        const indices = res.indices
        const distances = res.distances
        d3.selectAll('.dataCircle')
          .data(finalData)
          .classed('nuplot-highlighted', function (datum: any) {
            return indices.includes(finalData.indexOf(datum))
          })
        d3.selectAll('.dataCircle').classed(
          'nuplot-masked',
          function (datum: any) {
            return !this.getAttribute('class')?.includes(
              'nuplot-highlighted'
            )
          }
        )

        const neighborElements = d3.selectAll('.nuplot-highlighted')
        const masked = d3.selectAll('.nuplot-masked')
        masked
          .attr('fill', (d: any) => d.color)
          .attr('r', circleOriginalSize)
          .classed('nuplot-selected', false)

        const neighbors: any[] = []
        neighborElements.each((d: any, i: number) => {
          d.outline_color = nnColorAssignment[i]
          d.distance = distances[indices.indexOf(finalData.indexOf(d))]
          neighbors.push(d)
        })
        neighbors.sort((a, b) => a.distance - b.distance)
        neighborElements
          .attr('fill', (d: any) => d.outline_color)
          .attr('r', circleFocusSize)

        store.commit('metamineNU/setNeighbors', neighbors)
        store.commit('metamineNU/setDialogBoxActiveKnn', true)
      })
    }
  }

  const chartExtent: [[number, number], [number, number]] = [
    [0, 0],
    [WIDTH, HEIGHT]
  ]

  // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 20]) // This control how much you can unzoom (x1) and zoom (x20)
    .translateExtent(chartExtent)
    .extent(chartExtent)
    .on('zoom', (event) => {
      // recover the new scale
      const newXScale = event.transform.rescaleX(xScale)
      const newYScale = event.transform.rescaleY(yScale)

      // update axes with these new boundaries
      const xAxisCall = d3
        .axisBottom(newXScale)
        .tickFormat((x: any) => `${expo(x, 2)}`)
      const yAxisCall = d3
        .axisLeft(newYScale)
        .tickFormat((y: any) => `${expo(y, 2)}`)
      chartData.value.xAxisGroup.transition().duration(500).call(xAxisCall)
      chartData.value.yAxisGroup.transition().duration(500).call(yAxisCall)

      chartData.value.xScaleForBrush = newXScale
      chartData.value.yScaleForBrush = newYScale

      d3.selectAll('.dataCircle')
        .data(finalData)
        .attr('cy', (d: any) => newYScale(d[query2]))
        .attr('cx', (d: any) => newXScale(d[query1]))
    })

  const brush = d3.brush().on('brush end', (event) => {
    if (event.sourceEvent?.type === 'zoom') return // ignore brush-by-zoom
    if (event.selection) {
      const _xScale = chartData.value.xScaleForBrush
      const _yScale = chartData.value.yScaleForBrush
      d3.selectAll('.dataCircle')
        .data(finalData)
        .classed('nuplot-selected', function (d: any) {
          return (
            d3.select(this).classed('nuplot-selected') ||
            isBrushed(
              event.selection,
              _xScale(d[query1]),
              _yScale(d[query2])
            )
          )
        })
    }
    const selected: any[] = []
    d3.selectAll('.nuplot-selected').each((d: any, i: number) => selected.push(d))
    store.commit('metamineNU/setSelectedData', selected)
  })

  // apply zoom and brush to svg
  chartData.value.svg.select('g.brush').call(brush).on('wheel.zoom', null)
  chartData.value.svg.call(zoom).on('mousedown.zoom', null)

  const circles = chartData.value.svg
    .append('g')
    .attr('clip-path', 'url(#clip)')
    .attr('class', 'clipPath')
    .selectAll('.dataCircle')
    .data(finalData)

  circles.exit().transition().attr('r', 0).remove()
  circles
    .enter()
    .append('circle')
    .join(circles)
    .attr('r', circleOriginalSize)
    .attr('class', 'dataCircle')
    .attr('fill', (d: any) => d.color)
    .classed('nuplot-selected', function (d: any) {
      return selectedData.value.includes(d)
    })
    .style('stroke', 'none')
    .style('stroke-width', 2)
    .style('fill-opacity', 0.8)
    .on('mousedown', mousedown)
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseleave', mouseleave)
    .attr('cx', (d: any) => xScale(d[query1]))
    .attr('cy', (d: any) => yScale(d[query2]))

  circles.exit().transition().attr('r', 0).remove()
  if (reset.value) {
    chartData.value.svg.call(zoom.transform, d3.zoomIdentity)
    d3.selectAll('.nuplot-selected').classed('nuplot-selected', false)
    store.commit('metamineNU/setSelectedData', [])
    store.commit('metamineNU/setReset', false)
    store.commit('metamineNU/setKnnUmap', 15)
  }
}

async function getKnnData(dataPoint: number[], data: any[]): Promise<{ distances: number[]; indices: number[] }> {
  const url = 'https://metamaterials-srv.northwestern.edu/model/'
  const response = await fetch(`${url}`, {
    method: 'POST',
    mode: 'cors',
    body: JSON.stringify({
      dataPoint: [dataPoint],
      data: data.map((d) => [d.X, d.Y])
    })
  }).catch((err) => {
    alert(err.message)
  })
  if (!response) {
    return { distances: [], indices: [] }
  }
  const { distances, indices } = await response.json()
  return { distances: distances, indices: indices }
}

onMounted(async () => {
  store.commit('metamineNU/setPage', 'umap', { root: true })
  if (umapPlot.value) {
    createSvg({ container: umapPlot.value })
  }
  if (activeData.value.length && umapPlot.value) {
    update({ container: umapPlot.value })
  }
})

watch(
  activeData,
  (newVal, oldVal) => {
    if (chartData.value.svg && JSON.stringify(newVal) !== JSON.stringify(oldVal) && umapPlot.value) {
      update({
        container: umapPlot.value
      })
    }
  },
  { deep: true }
)

watch(dataPoint, (newVal, oldVal) => {
  store.commit('metamineNU/setDataPoint', newVal)
})

watch(reset, (newVal, oldVal) => {
  if (chartData.value.svg && umapPlot.value) {
    update({
      container: umapPlot.value
    })
  }
})

watch(knnUmap, (newVal, oldVal) => {
  if (chartData.value.svg && umapPlot.value) {
    update({
      container: umapPlot.value
    })
  }
})

watch(enableKnn, () => {
  if (chartData.value.svg && umapPlot.value) {
    update({
      container: umapPlot.value
    })
  }
})
</script>
