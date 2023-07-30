<template>
    <div ref="pairwisePlot"></div>
</template>

<script>
import * as d3 from 'd3'
import { processData } from '../utils/processData'
import { mapState } from 'vuex'

const margin = { top: 10, right: 20, bottom: 50, left: 100 }
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const width = Math.min(vw * 0.4, vh * 0.8)
const height = width
// const width = height
const padding = 20

function expo (x, f) {
  if (x < 1000 && x > -1000) return x
  return Number(x).toExponential(f)
}

export default {
  name: 'pairwise-plot',
  mounted: async function () {
    this.$store.dispatch('metamineNU/setPage', 'pairwise', { root: true })
    const bucketName = 'ideal-dataset-1'
    const fetchedNamesResponse = await fetch(`/api/aws/${bucketName}`).then(
      (response) => {
        return response.json()
      }
    )
    this.$store.dispatch(
      'metamineNU/setFetchedNames',
      fetchedNamesResponse.fetchedNames,
      { root: true }
    )

    this.fetchedNames.map(async (info, index) => {
      const fetchedData = await fetch(
                `/api/aws/${bucketName}/${info.name}`
      )
        .then((response) => {
          return response.json()
        })
        .then((data) => {
          return data.fetchedData
        })
      const processedData = fetchedData.map((dataset, index) => {
        return processData(dataset, index)
      })
      processedData.map((p) => (p.name = info.name))
      processedData.map((p) => (p.color = info.color))
      this.csvData.push(...processedData)
      this.activeData.push(...processedData)

      this.$store.dispatch('metamineNU/setDatasets', this.csvData, {
        root: true
      })
      this.$store.dispatch('metamineNU/setActiveData', this.activeData, {
        root: true
      })
      this.$store.dispatch('metamineNU/setDataPoint', processedData[0], {
        root: true
      })
    })
    this.container = this.$refs.pairwisePlot
    this.createSvg({
      container: this.container,
      columns: ['C11', 'C12', 'C22', 'C16', 'C26', 'C66']
    })
  },
  computed: {
    ...mapState('metamineNU', {
      csvData: (state) => state.datasets,
      activeData: (state) => state.activeData,
      dataPoint: (state) => state.dataPoint,
      fetchedNames: (state) => state.fetchedNames
    })
  },
  data () {
    return {
      chart: false
    }
  },
  watch: {
    csvData: {
      deep: true,
      handler (newVal, oldVal) {
        this.update({
          columns: ['C11', 'C12', 'C22', 'C16', 'C26', 'C66'],
          container: this.container,
          maxNumDatasets: this.fetchedNames.length,
          router: this.$router
        })
      }
    },
    activeData: {
      deep: true,
      handler (newVal, oldVal) {
        this.update({
          columns: ['C11', 'C12', 'C22', 'C16', 'C26', 'C66'],
          container: this.container,
          maxNumDatasets: this.fetchedNames.length,
          router: this.$router
        })
      }
    },
    fetchedNames: {
      handler (newVal, oldVal) {
        this.update({
          columns: ['C11', 'C12', 'C22', 'C16', 'C26', 'C66'],
          container: this.container,
          maxNumDatasets: this.fetchedNames.length,
          router: this.$router
        })
      }
    },
    dataPoint: {
      handler (newVal, oldVal) {
        this.$store.dispatch('metamineNU/setDataPoint', newVal, {
          root: true
        })
      }
    }
  },
  methods: {
    createSvg ({ container, columns }) {
      const data = this.activeData
      var x = columns
      var y = columns
      var z = () => 1
      var zDomain
      const fillOpacity = 0.7

      // Compute values (and promote column names to accessors).
      const X = d3.map(x, (x) =>
        d3.map(data, typeof x === 'function' ? x : (d) => +d[x])
      )
      const Y = d3.map(y, (y) =>
        d3.map(data, typeof y === 'function' ? y : (d) => +d[y])
      )
      const Z = d3.map(data, z)

      // Compute default z-domain, and unique the z-domain.
      if (zDomain === undefined) zDomain = Z
      zDomain = new d3.InternSet(zDomain)

      const svg = d3
        .select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [-margin.left, -margin.top, width, height])
      // Compute the inner dimensions of the cells.
      const cellWidth =
                (width -
                    margin.left -
                    margin.right -
                    (X.length - 1) * padding) /
                X.length
      const cellHeight =
                (height -
                    margin.top -
                    margin.bottom -
                    (Y.length - 1) * padding) /
                Y.length

      const cell = svg
        .append('g')
        .selectAll('g')
        .data(d3.cross(d3.range(X.length), d3.range(Y.length)))
        .join('g')
        .attr('fill-opacity', fillOpacity)
        .attr(
          'transform',
          ([i, j]) =>
                        `translate(${i * (cellWidth + padding)},${
                            j * (cellHeight + padding)
                        })`
        )

      cell.append('rect')
        .attr('fill', 'white')
        .attr('stroke', 'grey')
        .attr('stroke-width', 2)
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('class', 'cell')

      if (x === y) {
        svg.append('g')
          .attr('font-size', 14)
          .attr('font-family', 'sans-serif')
          .attr('font-weight', 'bold')
          .selectAll('text')
          .data(x)
          .join('text')
          .attr(
            'transform',
            (d, i) =>
                            `translate(${0 - margin.left + padding * 1.5},${
                                i * (cellHeight + padding) + margin.top * 6
                            }) rotate(270)`
          )
          .attr('x', padding / 2)
          .attr('y', padding / 2)
          .attr('dy', '.71em')
          .text((d) => d)
      }

      if (x === y) {
        svg.append('g')
          .attr('font-size', 14)
          .attr('font-family', 'sans-serif')
          .attr('font-weight', 'bold')
          .selectAll('text')
          .data(y)
          .join('text')
          .attr(
            'transform',
            (d, i) =>
                            `translate(${
                                i * (cellWidth + padding) 
                            },${cellHeight * 6 + margin.bottom + padding * 4})`
          )
          .attr('x', padding / 2)
          .attr('y', padding / 2)
          .text((d) => d)
      }
      this.chart = true
      this.svg = svg
      this.cell = cell
      this.cellWidth = cellWidth
      this.cellHeight = cellHeight
      this.X = X
      this.Y = Y
      this.Z = Z
      this.zDomain = zDomain

      this.update({
        columns: columns,
        container: container,
        maxNumDatasets: this.fetchedNames.length,
        router: this.$router
      })
    },

    renderAxis ({
      data,
      columns = data.columns, // array of column names, or accessor functions
      x = columns, // array of x-accessors
      y = columns, // array of y-accessors
      z = () => 1, // given d in data, returns the (categorical) z-value
      xType = d3.scaleLinear, // the x-scale type
      yType = d3.scaleLinear, // the y-scale type
      zDomain, // array of z-values
      fillOpacity = 0.7, // opacity of the dots
      colors = d3.schemeCategory10, // array of colors for z
      container = this.container
    } = {}) {
      const X = d3.map(x, (x) =>
        d3.map(data, typeof x === 'function' ? x : (d) => +d[x])
      )
      const Y = d3.map(y, (y) =>
        d3.map(data, typeof y === 'function' ? y : (d) => +d[y])
      )
      const Z = d3.map(data, z)

      // Compute default z-domain, and unique the z-domain.
      if (zDomain === undefined) zDomain = Z
      zDomain = new d3.InternSet(zDomain)

      //   // Omit any data not present in the z-domain.
      //   const I = d3.range(Z.length).filter((i) => zDomain.has(Z[i]))

      // Compute the inner dimensions of the cells.
      const cellWidth =
                (width -
                    margin.left -
                    margin.right -
                    (X.length - 1) * padding) /
                X.length
      const cellHeight =
                (height -
                    margin.top -
                    margin.bottom -
                    (Y.length - 1) * padding) /
                Y.length

      // Construct scales and axes.
      const xScales = X.map((X) => xType(d3.extent(X), [0, cellWidth]))
      const yScales = Y.map((Y) => yType(d3.extent(Y), [cellHeight, 0]))
      const xAxis = d3
        .axisBottom()
        .tickFormat((x) => `${expo(x, 0)}`)
        .ticks(3)
      const yAxis = d3
        .axisLeft()
        .tickFormat((x) => `${expo(x, 0)}`)
        .ticks(3)
      this.svg
        .append('g')
        .selectAll('g')
        .data(yScales)
        .join('g')
        .attr(
          'transform',
          (d, i) => `translate(0,${i * (cellHeight + padding)})`
        )
        .attr('class', 'yAxisGroup')
        .each(function (yScale) {
          d3.select(this).call(yAxis.scale(yScale))
        })

      this.svg
        .append('g')
        .selectAll('.xAxisGroup')
        .data(xScales)
        .join('g')
        .attr(
          'transform',
          (d, i) =>
                        `translate(${i * (cellWidth + padding)}, ${
                            height - margin.bottom - margin.top
                        })`
        )
        .attr('class', 'xAxisGroup')
        .each(function (xScale, columns) {
          d3.select(this).call(xAxis.scale(xScale))
        })
    },

    update ({
      columns, // array of column names, or accessor functions
      x = columns, // array of x-accessors
      y = columns, // array of y-accessors
      z = () => 1, // given d in data, returns the (categorical) z-value
      height = width, // outer height, in pixels
      xType = d3.scaleLinear, // the x-scale type
      yType = d3.scaleLinear, // the y-scale type
      zDomain, // array of z-values
      router,
      colors = {}, // array of colors for z

      container,
      maxNumDatasets
    }) {
      const self = this

      const circleFocusSize = 7
      const circleSize = 3.5
      const datasets = []
      const datasetDic = {}
      for (let i = 0; i < maxNumDatasets; i++) {
        datasets.push([])
      }
      const data = this.activeData
      const organizedData = this.organizeByName(data)
      organizedData.map((d, i) => {
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
      this.renderAxis({
        data: finalData,
        columns: ['C11', 'C12', 'C22', 'C16', 'C26', 'C66'],
        // z: d => d.species
        colors: data.color,
        container: container
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

      const mouseoverCirc = function (e, d) {
        d3.select(this)
          .attr('r', circleFocusSize)
          .style('stroke', 'black')
          .style('stroke-width', 2)
          .style('fill-opacity', 1)
        self.$store.dispatch('metamineNU/setDataPoint', finalData[d], {
          root: true
        })
        tooltipCirc
          .style('visibility', 'visible')
          .transition()
          .duration(200)
      }

      const mouseleaveCirc = function (e, d) {
        tooltipCirc
          .style('visibility', 'hidden')
          .transition()
          .duration(200)
        d3.select(this)
          .attr('r', circleSize)
          .style('stroke', 'none')
          .style('stroke-width', 2)
          .style('fill-opacity', 0.8)
      }

      const mouseleaveRec = function (e, d) {
        tooltipHist
          .style('visibility', 'hidden')
          .transition()
          .duration(200)
        d3.select(this)
          .style('fill', 'white')
          .style('stroke', 'grey')
          .style('stroke-width', 2)
          .style('fill-opacity', 0.8)
      }

      const mouseoverHist = function (e, d) {
        d3.select(this)
          .style('stroke', 'black')
          .style('stroke-width', 5)
          .style('fill-opacity', 1)
        tooltipHist
          .style('visibility', 'visible')
          .transition()
          .duration(200)
      }

      const mouseoverNonHist = function (e, d) {
        d3.select(this)
          .style('stroke', 'black')
          .style('stroke-width', 4)
          .style('fill-opacity', 1)
      }

      const mousedownNonHist = function (e, d) {
        d3.select(container.current).remove()
        self.$store.dispatch('metamineNU/setPage', 'scatter', {
          root: true
        })
        self.$store.dispatch('metamineNU/setQuery1', x[d[0]], {
          root: true
        })
        self.$store.dispatch('metamineNU/setQuery2', x[d[1]], {
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

      const mousedownHist = function (e, d) {
        d3.select(container.current).remove()
        self.$store.dispatch('metamineNU/setPage', 'hist', {
          root: true
        })
        router.push({
          path: '/mm/metamaterial_visualization_nu/hist',
          query: {
            pairwise_query1: x[d[0]]
          }
        })
      }

      const mousemoveCirc = function (e, d) {
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

      const mousemoveHist = function (e, d) {
        const column = columns[parseInt(d)]
        const tempArr = [...finalData.map((data) => data[column])]
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
        d3.map(finalData, typeof x === 'function' ? x : (d) => +d[x])
      )
      const Y = d3.map(y, (y) =>
        d3.map(finalData, typeof y === 'function' ? y : (d) => +d[y])
      )
      const Z = d3.map(finalData, z)

      // Compute default z-domain, and unique the z-domain.
      if (zDomain === undefined) zDomain = Z
      zDomain = new d3.InternSet(zDomain)

      // Omit any data not present in the z-domain.
      const I = d3.range(Z.length).filter((i) => zDomain.has(Z[i]))

      // Compute the inner dimensions of the cells.
      const cellWidth =
                (width -
                    margin.left -
                    margin.right -
                    (X.length - 1) * padding) /
                X.length
      const cellHeight =
                (height -
                    margin.top -
                    margin.bottom -
                    (Y.length - 1) * padding) /
                Y.length

      // Construct scales and axes.
      const xScales = X.map((X) => xType(d3.extent(X), [0, cellWidth]))
      const yScales = Y.map((Y) => yType(d3.extent(Y), [cellHeight, 0]))

      this.cell.each(function ([x, y]) {
        if (x !== y) {
          d3.select(this)
            .select('.cell')
            .attr('class', 'non_hist')
            .on('mouseover', mouseoverNonHist)
            .on('mousedown', mousedownNonHist)
            .on('mouseout', mouseleaveRec)

          d3.select(this)
            .selectAll('circle')
            .data(
              I.filter((i) => !isNaN(X[x][i]) && !isNaN(Y[y][i]))
            )
            .join('circle')
            .attr('r', circleSize)
            .attr('cx', (i) => xScales[x](X[x][i]))
            .attr('cy', (i) => yScales[y](Y[y][i]))
            .attr('fill', (i) => finalData[i].color)
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
              d3.map(
                datasets[i],
                typeof a === 'function' ? a : (d) => +d[a]
              )
            )
            let Y0 = d3.map(b, (b) =>
              d3.map(
                datasets[i],
                typeof b === 'function' ? b : (d) => +d[b]
              )
            )
            const Z = d3.map(datasets[i], z)

            // Omit any data not present in the z-domain.
            const I0 = d3
              .range(Z.length)
              .filter((i) => zDomain.has(Z[i]))
            const thresholds = 40
            Y0 = d3.map(Y0[y], () => 1)
            const bins = d3
              .bin()
              .thresholds(thresholds)
              .value((i) => X0[x][i])(I0)
            const Y1 = Array.from(bins, (I0) =>
              d3.sum(I0, (i) => Y0[i])
            )

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

            // when two dataset are selected, shows one color, but shows none when 1 or none are selected

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
                .attr('x', (d) => xScale(d.x0) + insetLeft)
                .attr('width', (d) =>
                  bins.length === 1
                    ? 5
                    : Math.max(
                      0,
                      xScale(d.x1) -
                                                  xScale(d.x0) -
                                                  insetLeft -
                                                  insetRight
                    )
                )
                .attr('y', (d, i) => yScale(Y1[i]))
                .attr(
                  'height',
                  (d, i) => yScale(0) - yScale(Y1[i])
                )

              histogram.exit().remove()
            }
          }
        }
      })
    },
    organizeByName: (data) => {
      const datasetNames = [...new Set(data.map((d) => d.name))]

      const datasets = []

      datasetNames.map((name, i) => {
        datasets.push({
          name: name,
          color: data.filter((d) => d.name === name)[0].color,
          data: data.filter((d) => d.name === name)
        })
      })

      return datasets
    }
  }
}
</script>
