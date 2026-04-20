<template>
  <div ref="histogramPlot"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import * as d3 from 'd3'
import { organizeByName } from '@/modules/metamine/utils/organizeByName'

const padding = 10 // separation between adjacent cells, in pixels
const marginTop = 0 // top margin, in pixels
const marginRight = 0 // right margin, in pixels
const marginBottom = 0 // bottom margin, in pixels
const marginLeft = 0 // left margin, in pixels
const width = 968 // outer width, in pixels
const columns = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66']

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
const histogramPlot = ref<HTMLElement | null>(null)

const chartData = ref<ChartData>({
  chart: false
})

const csvData = computed(() => store.state.metamineNU.datasets)
const activeData = computed(() => store.state.metamineNU.activeData)
const dataPoint = computed(() => store.state.metamineNU.dataPoint)
const fetchedNames = computed(() => store.state.metamineNU.fetchedNames)
const query1 = computed(() => store.state.metamineNU.query1)

function expo(x: number, f: number): string | number {
  if (x < 1000 && x > -1000) return x
  return Number(x).toExponential(f)
}

function createSvg({ container }: { container: HTMLElement }) {
  const data = activeData.value
  const x = columns
  const y = columns
  const z = () => 1
  let zDomain
  const fillOpacity = 0.7
  const height = width

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

  // Compute the inner dimensions of the cells.
  const cellWidth =
    (width - marginLeft - marginRight - (X.length - 1) * padding) /
    X.length
  const cellHeight =
    (height - marginTop - marginBottom - (Y.length - 1) * padding) /
    Y.length

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [
      padding * 2,
      padding * 5,
      width,
      height + padding * 13
    ])
    .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')

  const cell = svg
    .append('g')
    .selectAll('g')
    .data(d3.cross(d3.range(X.length), d3.range(Y.length)))
    .join('g')
    .attr('fill-opacity', fillOpacity)
    .attr(
      'transform',
      `translate(${cellWidth + padding},${cellHeight - 2 * marginBottom})`
    )

  chartData.value.chart = true
  chartData.value.svg = svg
  chartData.value.cell = cell
  chartData.value.cellWidth = cellWidth
  chartData.value.cellHeight = cellHeight
  chartData.value.X = X
  chartData.value.Y = Y
  chartData.value.Z = Z
  chartData.value.zDomain = zDomain
}

function update({
  x = columns, // array of x-accessors
  y = columns, // array of y-accessors
  z = () => 1, // given d in data, returns the (categorical) z-value
  height = width, // outer height, in pixels
  xType = d3.scaleLinear, // the x-scale type
  yType = d3.scaleLinear, // the y-scale type
  zDomain, // array of z-values
  fillOpacity = 0.7, // opacity of the dots
  colors = {} as Record<string, string>, // array of colors for z
  maxNumDatasets
}: {
  x?: string[]
  y?: string[]
  z?: () => number
  height?: number
  xType?: any
  yType?: any
  zDomain?: any
  fillOpacity?: number
  colors?: Record<string, string>
  maxNumDatasets: number
}) {
  const query1Value = query1.value

  const index = columns.indexOf(query1Value)
  const datasets: any[] = []
  const datasetDic: Record<number, string> = {}
  const tooltip: any[] = []
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
  d3.selectAll('.tooltip_hist').remove()
  d3.selectAll('.x-label').remove()
  d3.selectAll('.y-label').remove()

  for (let i = 0; i < maxNumDatasets; i++) {
    d3.selectAll('.group' + i).remove()
    d3.selectAll('.mean-line' + i).remove()
  }

  const mouseleaveRec = function (e: any, d: any) {
    d3.select(this)
      .style('stroke', 'grey')
      .style('stroke-width', 0)
      .style('fill-opacity', 0.8)
  }

  const mouseoverHist = function (e: any, d: any) {
    d3.select(this)
      .raise()
      .style('stroke', 'black')
      .style('stroke-width', 5)
      .style('fill-opacity', 1)
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

  // Compute the inner dimensions of the cells.
  const cellWidth = width - marginRight - (X.length - 1) * padding
  const cellHeight =
    height - marginTop - marginBottom - (Y.length - 1) * padding

  // Construct scales and axes.
  const xScales = X.map((X: any) => xType(d3.extent(X), [0, cellWidth]))

  const allBins: any[] = []
  chartData.value.cell.each(function ([x, y]: [number, number]) {
    if (x === index && y === index) {
      d3.select(this)
        .append('g')
        .attr('id', `${query1Value}`)
        .attr('class', 'x-label')
        .attr('font-size', 20)
        .attr('font-family', 'sans-serif')
        .attr('font-weight', 'bold')
        .selectAll('text')
        .data([columns[index]])
        .join('text')
        .attr(
          'transform',
          (d: any, i: number) => `translate(${width / 3},${width + padding * 2})`
        )
        .attr('x', padding / 2)
        .attr('y', padding / 2)
        .text((d: string) => d)

      d3.select(this)
        .append('g')
        .attr('class', 'y-label')
        .attr('font-size', 20)
        .attr('font-family', 'sans-serif')
        .attr('font-weight', 'bold')
        .selectAll('text')
        .data(['Frequency'])
        .join('text')
        .attr(
          'transform',
          `translate(${-width / 10 - padding * 6},${
            cellHeight / 2 + padding
          }) rotate(270)`
        )
        .attr('x', padding / 2)
        .attr('y', padding / 2)
        .text((d: string) => d)

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
        Y0 = d3.map(Y0[index], () => 1)
        const bins = d3
          .bin()
          .thresholds(thresholds)
          .value((i: any) => X0[index][i])(I0)
        allBins.push(...bins)
        const tempTooltip: any = {}
        if (organizedData[i]) {
          const tempArr = organizedData[i].data.map((d: any, i: number) => d[query1Value])
          tempTooltip.name = organizedData[i].name
          tempTooltip.color = organizedData[i].color
          tempTooltip.min = d3.min(tempArr)
          tempTooltip.max = d3.max(tempArr)
          tempTooltip.mean = d3.mean(tempArr)
          tempTooltip.median = d3.median(tempArr)
          tooltip.push(tempTooltip)
        }

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
            .attr('transform', `translate(${-width / 10}, ${0})`)

          d3.selectAll('.group' + i)
            .on('mouseover', mouseoverHist)
            .on('mouseleave', mouseleaveRec)
          histogram.exit().remove()
        }
      }
    } else if (x !== index) {
      d3.select(`#${columns[x]}`).remove()
    }
  })
  // draw axis
  const maxBinLen = d3.max(allBins, (b: any) => {
    return b.length
  })
  const histYScales = d3
    .scaleLinear()
    .domain([0, maxBinLen])
    .range([cellHeight, 0])
  const xAxis = d3
    .axisBottom()
    .tickFormat((x: any) => `${expo(x, 0)}`)
    .ticks(3)
  const yAxis = d3.axisLeft().ticks(3)

  const yAxisLine = chartData.value.svg
    .append('g')
    .selectAll('g')
    .data([histYScales])
    .join('g')
    .attr('transform', `translate(${padding * 6 + 5},${padding * 16 - 5})`)
    .attr('class', 'yAxisGroup')
    .call(yAxis.scale(histYScales))

  yAxisLine
    .selectAll('text')
    .attr('font-size', 20)
    .attr('font-family', 'sans-serif')

  const xAxisLine = chartData.value.svg
    .append('g')
    .selectAll('.xAxisGroup')
    .data(xScales)
    .join('g')
    .attr(
      'transform',
      `translate(${width / 15}, ${width + padding * 10 + 5})`
    )
    .attr('class', 'xAxisGroup')
    .call(xAxis.scale(xScales[index]))

  xAxisLine
    .selectAll('text')
    .attr('font-size', 18)
    .attr('font-family', 'sans-serif')
    .attr('text-anchor', 'middle')

  const transitionDuration = 200

  const exitTransition = d3.transition().duration(transitionDuration)
  const updateTransition = exitTransition
    .transition()
    .duration(transitionDuration)

  tooltip.map((d: any, i: number) => {
    const mean = tooltip[i].mean
    chartData.value.svg
      .append('g')
      .append('line')
      .attr('class', 'mean-line' + i)
      .raise()
      .transition(updateTransition)
      .attr('x1', xScales[index](mean) + width / 15)
      .attr('y1', width + padding * 10 + 5)
      .attr('x2', xScales[index](mean) + width / 15)
      .attr('y2', padding * 16 - 5)
      .attr('stroke', colors[datasetDic[i]])
      .attr('stroke-width', 6)
      .attr('fill', 'None')
      .style('stroke-dasharray', '5, 5')
  })

  const tooltipContent = tooltip.map(
    (d: any, i: number) =>
      '<b>Dataset: </b>' +
      d.name +
      '<br>' +
      '<b>Range: </b>' +
      expo(d.min, 0) +
      ' to ' +
      expo(d.max, 0) +
      '<br>' +
      '<b>Mean: </b>' +
      expo(d.mean.toPrecision(4)) +
      '<br>' +
      '<b>Median: </b>' +
      expo(d.median, 0) +
      '<br>'
  )

  d3.select(histogramPlot.value)
    .append('div')
    .style('overflow-y', 'auto')
    .style('width', '280px')
    .style('height', '200px')
    .attr('class', 'tooltip_hist')
    .style('position', 'fixed')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('stroke', 'white')
    .style('box-shadow', '5px 5px 5px 0px rgba(0,0,0,0.3)')
    .style('border-width', '2px')
    .style('border-radius', '5px')
    .style('padding', '10px')
    .style('visibility', 'visible')
    .html(tooltipContent.join('<br>'))
    .style('top', 100 + 'px')
    .style('left', 25 + 'vw')
}

onMounted(async () => {
  store.commit('metamineNU/setPage', 'hist', { root: true })
  if (histogramPlot.value) {
    createSvg({ container: histogramPlot.value })
  }
})

watch(
  activeData,
  (newVal, oldVal) => {
    update({
      maxNumDatasets: fetchedNames.value.length
    })
  },
  { deep: true }
)

watch(dataPoint, (newVal, oldVal) => {
  store.commit('metamineNU/setDataPoint', newVal, {
    root: true
  })
})

watch(query1, () => {
  if (chartData.value.svg) {
    update({
      maxNumDatasets: fetchedNames.value.length
    })
  }
})
</script>
