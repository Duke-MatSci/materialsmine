<template>
  <div ref="pairwisePlot"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { organizeByName } from '@/modules/metamine/utils/organizeByName'

const margin = { top: 10, right: 20, bottom: 50, left: 100 }
const vw = Math.max(
  document.documentElement.clientWidth || 0,
  window.innerWidth || 0
)
let wFactor = 0.48

if (vw <= 1280) {
  wFactor = 0.9
}

const width = vw * wFactor
const padding = 20

interface ChartData {
  chart: boolean
  svg?: any
  cell?: any
  cellWidth?: number
  cellHeight?: number
  X?: any
  Y?: any
  Z?: any
  zDomain?: any
}

const store = useStore()
const router = useRouter()
const pairwisePlot = ref<HTMLElement | null>(null)

const chartData = ref<ChartData>({
  chart: false
})

const csvData = computed(() => store.state.metamineNU.datasets)
const activeData = computed(() => store.state.metamineNU.activeData)
const dataPoint = computed(() => store.state.metamineNU.dataPoint)
const fetchedNames = computed(() => store.state.metamineNU.fetchedNames)

const mainChart = computed(() => document.getElementById('main_chart'))
const widthComputed = computed(() => mainChart.value?.offsetWidth ?? width)
const heightComputed = computed(() => widthComputed.value)

function expo(x: number, f: number): string | number {
  if (x < 1000 && x > -1000) return x
  return Number(x).toExponential(f)
}

function createSvg({ container, columns }: { container: HTMLElement; columns: string[] }) {
  const data = activeData.value
  const x = columns
  const y = columns
  const z = () => 1
  let zDomain
  const fillOpacity = 0.7

  // Compute values (and promote column names to accessors).
  const X = d3.map(x, (x) =>
    d3.map(data, typeof x === 'function' ? x : (d: any) => +d[x])
  )
  const Y = d3.map(y, (y) =>
    d3.map(data, typeof y === 'function' ? y : (d: any) => +d[y])
  )
  const Z = d3.map(data, z)

  // Compute default z-domain, and unique the z-domain.
  if (zDomain === undefined) zDomain = Z
  zDomain = new d3.InternSet(zDomain)

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', widthComputed.value)
    .attr('height', heightComputed.value)
    .attr('viewBox', [-margin.left, -margin.top, widthComputed.value, heightComputed.value])
    .attr('style', 'max-width: 100%;')
  // Compute the inner dimensions of the cells.
  const cellWidth =
    (widthComputed.value - margin.left - margin.right - (X.length - 1) * padding) /
    X.length
  const cellHeight =
    (heightComputed.value - margin.top - margin.bottom - (Y.length - 1) * padding) /
    Y.length

  const cell = svg
    .append('g')
    .selectAll('g')
    .data(d3.cross(d3.range(X.length), d3.range(Y.length)))
    .join('g')
    .attr('fill-opacity', fillOpacity)
    .attr(
      'transform',
      ([i, j]: [number, number]) =>
        `translate(${i * (cellWidth + padding)},${
          j * (cellHeight + padding)
        })`
    )

  cell
    .append('rect')
    .attr('fill', 'white')
    .attr('stroke', 'grey')
    .attr('stroke-width', 2)
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .attr('class', 'cell')

  if (x === y) {
    svg
      .append('g')
      .attr('font-size', 14)
      .attr('font-family', 'sans-serif')
      .attr('font-weight', 'bold')
      .selectAll('text')
      .data(x)
      .join('text')
      .attr(
        'transform',
        (d: string, i: number) =>
          `translate(${0 - margin.left + padding * 1.5},${
            i * (cellHeight + padding) + margin.top * 6
          }) rotate(270)`
      )
      .attr('x', padding / 2)
      .attr('y', padding / 2)
      .attr('dy', '.71em')
      .text((d: string) => d)
  }

  if (x === y) {
    svg
      .append('g')
      .attr('font-size', 14)
      .attr('font-family', 'sans-serif')
      .attr('font-weight', 'bold')
      .selectAll('text')
      .data(y)
      .join('text')
      .attr(
        'transform',
        (d: string, i: number) =>
          `translate(${i * (cellWidth + padding)},${
            cellHeight * 6 + margin.bottom + padding * 4
          })`
      )
      .attr('x', padding / 2)
      .attr('y', padding / 2)
      .text((d: string) => d)
  }
  chartData.value.chart = true
  chartData.value.svg = svg
  chartData.value.cell = cell
  chartData.value.cellWidth = cellWidth
  chartData.value.cellHeight = cellHeight
  chartData.value.X = X
  chartData.value.Y = Y
  chartData.value.Z = Z
  chartData.value.zDomain = zDomain

  update({
    columns: columns,
    container: container,
    maxNumDatasets: fetchedNames.value.length
  })
}

function renderAxis({
  data,
  columns = data.columns, // array of column names, or accessor functions
  x = columns, // array of x-accessors
  y = columns, // array of y-accessors
  z = () => 1, // given d in data, returns the (categorical) z-value
  xType = d3.scaleLinear, // the x-scale type
  yType = d3.scaleLinear, // the y-scale type
  zDomain // array of z-values
}: {
  data: any[]
  columns?: string[]
  x?: string[]
  y?: string[]
  z?: () => number
  xType?: any
  yType?: any
  zDomain?: any
} = {} as any) {
  const X = d3.map(x, (x) =>
    d3.map(data, typeof x === 'function' ? x : (d: any) => +d[x])
  )
  const Y = d3.map(y, (y) =>
    d3.map(data, typeof y === 'function' ? y : (d: any) => +d[y])
  )
  const Z = d3.map(data, z)

  // Compute default z-domain, and unique the z-domain.
  if (zDomain === undefined) zDomain = Z
  zDomain = new d3.InternSet(zDomain)

  // Compute the inner dimensions of the cells.
  const cellWidth =
    (widthComputed.value - margin.left - margin.right - (X.length - 1) * padding) /
    X.length
  const cellHeight =
    (heightComputed.value - margin.top - margin.bottom - (Y.length - 1) * padding) /
    Y.length

  // Construct scales and axes.
  const xScales = X.map((X: any) => xType(d3.extent(X), [0, cellWidth]))
  const yScales = Y.map((Y: any) => yType(d3.extent(Y), [cellHeight, 0]))
  const xAxis = d3
    .axisBottom()
    .tickFormat((x: any) => `${expo(x, 0)}`)
    .ticks(3)
  const yAxis = d3
    .axisLeft()
    .tickFormat((x: any) => `${expo(x, 0)}`)
    .ticks(3)
  chartData.value.svg
    .append('g')
    .selectAll('g')
    .data(yScales)
    .join('g')
    .attr(
      'transform',
      (d: any, i: number) => `translate(0,${i * (cellHeight + padding)})`
    )
    .attr('class', 'yAxisGroup')
    .each(function (yScale: any) {
      d3.select(this).call(yAxis.scale(yScale))
    })

  chartData.value.svg
    .append('g')
    .selectAll('.xAxisGroup')
    .data(xScales)
    .join('g')
    .attr(
      'transform',
      (d: any, i: number) =>
        `translate(${i * (cellWidth + padding)}, ${
          heightComputed.value - margin.bottom - margin.top
        })`
    )
    .attr('class', 'xAxisGroup')
    .each(function (xScale: any, columns: any) {
      d3.select(this).call(xAxis.scale(xScale))
    })
}

function update({
  columns, // array of column names, or accessor functions
  x = columns, // array of x-accessors
  y = columns, // array of y-accessors
  z = () => 1, // given d in data, returns the (categorical) z-value
  height = widthComputed.value, // outer height, in pixels
  xType = d3.scaleLinear, // the x-scale type
  yType = d3.scaleLinear, // the y-scale type
  zDomain, // array of z-values
  colors = {} as Record<string, string>, // array of colors for z
  container,
  maxNumDatasets
}: {
  columns: string[]
  x?: string[]
  y?: string[]
  z?: () => number
  height?: number
  xType?: any
  yType?: any
  zDomain?: any
  colors?: Record<string, string>
  container: HTMLElement
  maxNumDatasets: number
}) {
  const circleFocusSize = 7
  const circleSize = 3.5
  const datasets: any[] = []
  const datasetDic: Record<number, string> = {}
  for (let i = 0; i < maxNumDatasets; i++) {
    datasets.push([])
  }
  const data = activeData.value
  const organizedData = organizeByName(data)
  organizedData.map((d: any, i: number) => {
    colors[d.name] = d.color
    datasets[i] = d.data ? d.data : []
    datasetDic[i] = d.name
  })

  const finalData = [].concat(...datasets)

  // clean up before updating visuals
  d3.selectAll('.xAxisGroup').remove()
  d3.selectAll('.yAxisGroup').remove()
  d3.selectAll('.legend').remove()
  d3.selectAll('circle').remove()
  d3.selectAll('.tooltip_circ').remove()

  for (let i = 0; i < maxNumDatasets; i++) {
    d3.selectAll('.group' + i).remove()
  }
  renderAxis({
    data: finalData,
    columns: ['C11', 'C12', 'C22', 'C16', 'C26', 'C66']
  })

  const tooltipHist = d3
    .select(container)
    .append('div')
    .attr('class', 'tooltip_hist')
    .style('position', 'fixed')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '1px')
    .style('border-radius', '5px')
    .style('padding', '10px')
    .style('visibility', 'hidden')
    .style('z-index', 100)

  const tooltipCirc = d3
    .select(container)
    .append('div')
    .attr('class', 'tooltip_circ')
    .style('position', 'fixed')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '1px')
    .style('border-radius', '5px')
    .style('padding', '10px')
    .style('visibility', 'hidden')
    .style('z-index', 1000)

  const mouseoverCirc = function (e: any, d: any) {
    d3.select(this)
      .attr('r', circleFocusSize)
      .style('stroke', 'black')
      .style('stroke-width', 2)
      .style('fill-opacity', 1)
    store.commit('metamineNU/setDataPoint', finalData[d], {
      root: true
    })
    tooltipCirc.style('visibility', 'visible').transition().duration(200)
  }

  const mouseleaveCirc = function (e: any, d: any) {
    tooltipCirc.style('visibility', 'hidden').transition().duration(200)
    d3.select(this)
      .attr('r', circleSize)
      .style('stroke', 'none')
      .style('stroke-width', 2)
      .style('fill-opacity', 0.8)
  }

  const mouseleaveRec = function (e: any, d: any) {
    tooltipHist.style('visibility', 'hidden').transition().duration(200)
    d3.select(this)
      .style('fill', 'white')
      .style('stroke', 'grey')
      .style('stroke-width', 2)
      .style('fill-opacity', 0.8)
  }

  const mouseoverHist = function (e: any, d: any) {
    d3.select(this)
      .style('stroke', 'black')
      .style('stroke-width', 5)
      .style('fill-opacity', 1)
    tooltipHist.style('visibility', 'visible').transition().duration(200)
  }

  const mouseoverNonHist = function (e: any, d: any) {
    d3.select(this)
      .style('stroke', 'black')
      .style('stroke-width', 4)
      .style('fill-opacity', 1)
  }

  const mousedownNonHist = function (e: any, d: [number, number]) {
    d3.select(container).remove()
    store.commit('metamineNU/setPage', 'scatter', {
      root: true
    })
    store.commit('metamineNU/setQuery1', x[d[0]], {
      root: true
    })
    store.commit('metamineNU/setQuery2', x[d[1]], {
      root: true
    })
    router.push({
      path: '/mm/metamaterial_visualization_nu/scatter',
      query: {
        pairwise_query1: x[d[0]],
        pairwise_query2: x[d[1]]
      }
    })
  }

  const mousedownHist = function (e: any, d: [number, number]) {
    d3.select(container).remove()
    store.commit('metamineNU/setPage', 'hist', {
      root: true
    })
    router.push({
      path: '/mm/metamaterial_visualization_nu/hist',
      query: {
        pairwise_query1: x[d[0]]
      }
    })
  }

  const mousemoveCirc = function (e: any, d: number) {
    tooltipCirc
      .html(
        'Dataset: ' +
          datasetDic[Math.floor(d / datasets[0].length)] +
          '<br>symmetry: ' +
          finalData[d].symmetry
      )
      .style('top', e.pageY - 85 + 'px')
      .style('left', e.pageX - 165 + 'px')
  }

  const mousemoveHist = function (e: any, d: number) {
    const column = columns[parseInt(d.toString())]
    const tempArr = [...finalData.map((data: any) => data[column])]
    tooltipHist
      .html(
        'Column: ' +
          column +
          '<br>Range: ' +
          (d3.min(tempArr) > 0 ? d3.min(tempArr) : 0) +
          ' to ' +
          (d3.max(tempArr) > 0 ? d3.max(tempArr) : 0) +
          '<br>Mean: ' +
          d3.mean(tempArr) +
          '<br>Median: ' +
          d3.median(tempArr)
      )
      .style('top', e.pageY - 110 + 'px')
      .style('left', e.pageX + 10 + 'px')
  }

  // Compute values (and promote column names to accessors).
  const X = d3.map(x, (x) =>
    d3.map(finalData, typeof x === 'function' ? x : (d: any) => +d[x])
  )
  const Y = d3.map(y, (y) =>
    d3.map(finalData, typeof y === 'function' ? y : (d: any) => +d[y])
  )
  const Z = d3.map(finalData, z)

  // Compute default z-domain, and unique the z-domain.
  if (zDomain === undefined) zDomain = Z
  zDomain = new d3.InternSet(zDomain)

  // Omit any data not present in the z-domain.
  const I = d3.range(Z.length).filter((i) => zDomain.has(Z[i]))

  // Compute the inner dimensions of the cells.
  const cellWidth =
    (widthComputed.value - margin.left - margin.right - (X.length - 1) * padding) /
    X.length
  const cellHeight =
    (height - margin.top - margin.bottom - (Y.length - 1) * padding) /
    Y.length

  // Construct scales and axes.
  const xScales = X.map((X: any) => xType(d3.extent(X), [0, cellWidth]))
  const yScales = Y.map((Y: any) => yType(d3.extent(Y), [cellHeight, 0]))

  chartData.value.cell.each(function ([x, y]: [number, number]) {
    if (x !== y) {
      d3.select(this)
        .select('.cell')
        .attr('class', 'non_hist')
        .on('mouseover', mouseoverNonHist)
        .on('mousedown', mousedownNonHist)
        .on('mouseout', mouseleaveRec)

      d3.select(this)
        .selectAll('circle')
        .data(I.filter((i) => !isNaN(X[x][i]) && !isNaN(Y[y][i])))
        .join('circle')
        .attr('r', circleSize)
        .attr('cx', (i: number) => xScales[x](X[x][i]))
        .attr('cy', (i: number) => yScales[y](Y[y][i]))
        .attr('fill', (i: number) => finalData[i].color)
        .on('mouseover', mouseoverCirc)
        .on('mouseleave', mouseleaveCirc)
        .on('mousemove', mousemoveCirc)
    } else {
      d3.select(this)
        .selectAll('.cell')
        .attr('class', 'hist')
        .on('mouseover', mouseoverHist)
        .on('mouseleave', mouseleaveRec)
        .on('mousemove', mousemoveHist)
        .on('mousedown', mousedownHist)

      for (let i = 0; i < maxNumDatasets; i++) {
        const a = columns
        const b = columns

        const X0 = d3.map(a, (a) =>
          d3.map(datasets[i], typeof a === 'function' ? a : (d: any) => +d[a])
        )
        let Y0 = d3.map(b, (b) =>
          d3.map(datasets[i], typeof b === 'function' ? b : (d: any) => +d[b])
        )
        const Z = d3.map(datasets[i], z)

        // Omit any data not present in the z-domain.
        const I0 = d3.range(Z.length).filter((i) => zDomain.has(Z[i]))
        const thresholds = 40
        Y0 = d3.map(Y0[y], () => 1)
        const bins = d3
          .bin()
          .thresholds(thresholds)
          .value((i: any) => X0[x][i])(I0)
        const Y1 = Array.from(bins, (I0: any) => d3.sum(I0, (i: any) => Y0[i]))

        // Compute default domains.
        const xDomain = [bins[0].x0, bins[bins.length - 1].x1]
        const yDomain = [0, d3.max(Y1)]

        // Construct scales and axes.
        const xRange = [0, cellWidth]
        const yRange = [cellHeight, 0]
        const xScale = xType(xDomain, xRange)
        const yScale = yType(yDomain, yRange)

        const insetLeft = 0.5
        const insetRight = 0.5

        if (datasets[i].length === 0) {
          d3.selectAll('.group' + i).remove()
        } else {
          const histogram = d3
            .select(this)
            .append('g')
            .attr('class', 'group' + i)
          histogram
            .selectAll('rect')
            .data(bins)
            .join('rect')
            .attr('fill', colors[datasetDic[i]])
            .attr('x', (d: any) => xScale(d.x0) + insetLeft)
            .attr('width', (d: any) =>
              bins.length === 1
                ? 5
                : Math.max(
                  0,
                  xScale(d.x1) - xScale(d.x0) - insetLeft - insetRight
                )
            )
            .attr('y', (d: any, i: number) => yScale(Y1[i]))
            .attr('height', (d: any, i: number) => yScale(0) - yScale(Y1[i]))

          histogram.exit().remove()
        }
      }
    }
  })
}

onMounted(async () => {
  store.commit('metamineNU/setPage', 'pairwise', { root: true })
  if (pairwisePlot.value) {
    createSvg({
      container: pairwisePlot.value,
      columns: ['C11', 'C12', 'C22', 'C16', 'C26', 'C66']
    })
  }
})

watch(
  activeData,
  (newVal, oldVal) => {
    if (pairwisePlot.value) {
      update({
        columns: ['C11', 'C12', 'C22', 'C16', 'C26', 'C66'],
        container: pairwisePlot.value,
        maxNumDatasets: fetchedNames.value.length
      })
    }
  },
  { deep: true }
)

watch(dataPoint, (newVal, oldVal) => {
  store.commit('metamineNU/setDataPoint', newVal, {
    root: true
  })
})
</script>
