<template>
    <div ref="scatterPlot"></div>
</template>

<script>
import * as d3 from 'd3'
import { processData } from '@/modules/metamine/utils/processData'
import { mapState } from 'vuex'
import { nnColorAssignment } from '@/components/metamine/visualizationNU/constants.js'

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

function expo (x, f) {
  if (x < 1000 && x > -1000) return x
  return Number(x).toExponential(f)
}

function isBrushed (brushCoords, cx, cy) {
  var x0 = brushCoords[0][0]
  var x1 = brushCoords[1][0]
  var y0 = brushCoords[0][1]
  var y1 = brushCoords[1][1]
  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1 // This return TRUE or FALSE depending on if the points is in the selected area
}

export default {
  name: 'scatter-plot',
  mounted: async function () {
    this.$store.dispatch('metamineNU/setPage', 'scatter', { root: true })

    // fetch data from AWS
    // const bucketName = 'ideal-dataset-1'

    const fetchedNamesResponse = await fetch('/api/files/metamine').then(
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
                `/api/files/metamine/${info.name}`
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
      // Process data
      processedData.map((p) => (p.name = info.name))
      processedData.map((p) => (p.color = info.color))
      this.csvData.push(...processedData)
      this.activeData.push(...processedData)

      // Set data to store
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
    this.container = this.$refs.scatterPlot

    // Create svg
    this.createSvg({
      container: this.container
    })
  },
  computed: {
    ...mapState('metamineNU', {
      csvData: (state) => state.datasets,
      activeData: (state) => state.activeData,
      dataPoint: (state) => state.dataPoint,
      fetchedNames: (state) => state.fetchedNames,
      selectedData: (state) => state.selectedData,
      query1: (state) => state.query1,
      query2: (state) => state.query2,
      reset: (state) => state.reset
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
          container: this.container
        })
      }
    },
    activeData: {
      deep: true,
      handler (newVal, oldVal) {
        if (this.svg) {
          this.update({
            container: this.container
          })
        }
      }
    },
    fetchedNames: {
      handler (newVal, oldVal) {
        this.update({
          container: this.container
        })
      }
    },
    dataPoint: {
      handler (newVal, oldVal) {
        this.$store.dispatch('metamineNU/setDataPoint', newVal, {
          root: true
        })
      }
    },
    query1: {
      handler (newVal, oldVal) {
        if (this.svg) {
          this.update({
            container: this.container
          })
        }
      }
    },
    query2: {
      handler (newVal, oldVal) {
        if (this.svg) {
          this.update({
            container: this.container
          })
        }
      }
    },
    reset: {
      handler (newVal, oldVal) {
        if (this.svg) {
          this.update({
            container: this.container
          })
        }
      }
    }
  },
  methods: {
    createSvg ({ container }) {
      this.svg = d3
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
        .attr('style', 'max-width: 100%; overflow: visible;')

      // brush
      this.svg.append('g').attr('class', 'brush')

      // Labels
      this.xLabel = this.svg
        .append('text')
        .attr('x', WIDTH / 2)
        .attr('y', HEIGHT + 50)
        .attr('text-anchor', 'middle')
        .style('fill', 'black')

      this.yLabel = this.svg
        .append('text')
        .attr('x', -HEIGHT / 2)
        .attr('y', -60)
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .style('fill', 'black')
      // Append group el to display both axes
      this.xAxisGroup = this.svg
        .append('g')
        .attr('transform', `translate(0, ${HEIGHT})`)

      // Append group el to display both axes
      this.yAxisGroup = this.svg.append('g')

      this.chart = true

      this.xScaleForBrush = null
      this.yScaleForBrush = null
    },

    update ({ container }) {
      const data = this.activeData
      const self = this
      const datasets = data
      const finalData = [].concat(...datasets)
      const query1 = this.query1
      const query2 = this.query2
      // remove elements to avoid repeated append
      d3.selectAll('.legend').remove()
      d3.select('.nuplot-tooltip').remove()
      d3.selectAll('.dataCircle').remove()
      d3.selectAll('defs').remove()
      d3.selectAll('.clipPath').remove()

      const yScale = d3
        .scaleLinear()
        .domain([
          d3.min(finalData, (d) => d[query2]),
          d3.max(finalData, (d) => d[query2])
        ])
        .range([HEIGHT, 0])

      const xScale = d3
        .scaleLinear()
        .domain([
          d3.min(finalData, (d) => d[query1]),
          d3.max(finalData, (d) => d[query1])
        ])
        .range([0, WIDTH])

      this.xScaleForBrush = xScale
      this.yScaleForBrush = yScale

      // Add a clipPath: everything out of this area won't be drawn.
      this.svg
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
        .tickFormat((x) => `${expo(x, 2)}`)
      this.xAxisGroup.transition().duration(500).call(xAxisCall)

      const yAxisCall = d3
        .axisLeft(yScale)
        .tickFormat((y) => `${expo(y, 2)}`)
      this.yAxisGroup.transition().duration(500).call(yAxisCall)
      this.xLabel.text(this.query1)
      this.yLabel.text(this.query2)

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
      const mouseover = function (e, d) {
        d3.select(this)
          .attr('r', circleFocusSize)
          .style('stroke', 'black')
          .style('stroke-width', 2)
          .style('fill-opacity', 1)
        self.$store.dispatch('metamineNU/setDataPoint', d, {
          root: true
        })
        tooltip
          .style('visibility', 'visible')
          .transition()
          .duration(200)
      }

      const mousemove = function (e, d) {
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

      const mouseleave = function (e, d) {
        tooltip
          .style('visibility', 'hidden')
          .transition()
          .duration(200)
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

      const mousedown = function (e, d) {
        const inputData = [
          'C11',
          'C12',
          'C22',
          'C16',
          'C26',
          'C66'
        ].map((c) => d[c])
        const target = d3.select(this)
        target.classed(
          'nuplot-selected',
          !target.classed('nuplot-selected')
        )

        const selected = []
        d3.selectAll('.nuplot-selected').each((d, i) =>
          selected.push(d)
        )
        self.$store.dispatch('metamineNU/setSelectedData', selected, {
          root: true
        })

        target.classed('nuplot-selected', true)
        self.getKnnData(inputData, finalData).then((res) => {
          const indices = res.indices
          const distances = res.distances
          d3.selectAll('.dataCircle')
            .data(finalData)
            .classed('nuplot-highlighted', function (datum) {
              return indices.includes(finalData.indexOf(datum))
            })
          d3.selectAll('.dataCircle').classed(
            'nuplot-masked',
            function (datum) {
              return !this.getAttribute('class').includes(
                'nuplot-highlighted'
              )
            }
          )

          const neighborElements = d3.selectAll(
            '.nuplot-highlighted'
          )
          const masked = d3.selectAll('.nuplot-masked')
          masked
            .attr('fill', (d) => d.color)
            .attr('r', circleOriginalSize)
            .classed('nuplot-selected', false)

          const neighbors = []
          neighborElements.each((d, i) => {
            d.outline_color = nnColorAssignment[i]
            d.distance =
                            distances[indices.indexOf(finalData.indexOf(d))]
            neighbors.push(d)
          })
          neighbors.sort((a, b) => a.distance - b.distance)
          neighborElements
            .attr('fill', (d) => d.outline_color)
            .attr('r', circleFocusSize)

          self.$store.dispatch('metamineNU/setNeighbors', neighbors, {
            root: true
          })
        })
      }

      const chartExtent = [
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
            .tickFormat((x) => `${expo(x, 2)}`)
          const yAxisCall = d3
            .axisLeft(newYScale)
            .tickFormat((y) => `${expo(y, 2)}`)
          this.xAxisGroup.transition().duration(500).call(xAxisCall)
          this.yAxisGroup.transition().duration(500).call(yAxisCall)

          this.xScaleForBrush = newXScale
          this.yScaleForBrush = newYScale

          d3.selectAll('.dataCircle')
            .data(finalData)
            .attr('cy', (d) => newYScale(d[query2]))
            .attr('cx', (d) => newXScale(d[query1]))
        })

      const brush = d3.brush().on('brush end', (event) => {
        if (event.sourceEvent?.type === 'zoom') return // ignore brush-by-zoom
        if (event.selection) {
          const _xScale = this.xScaleForBrush
          const _yScale = this.yScaleForBrush
          d3.selectAll('.dataCircle')
            .data(finalData)
            .classed('nuplot-selected', function (d) {
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
        const selected = []
        d3.selectAll('.nuplot-selected').each((d, i) =>
          selected.push(d)
        )
        self.$store.dispatch('metamineNU/setSelectedData', selected, {
          root: true
        })
      })

      // apply zoom and brush to svg
      this.svg.select('g.brush').call(brush).on('wheel.zoom', null)
      this.svg.call(zoom).on('mousedown.zoom', null)

      const circles = this.svg
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
        .attr('fill', (d) => d.color)
        .classed('nuplot-selected', function (d) {
          return self.selectedData.includes(d)
        })
        .style('stroke', 'none')
        .style('stroke-width', 2)
        .style('fill-opacity', 0.8)
        .on('mousedown', mousedown)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave)
        .attr('cx', (d) => xScale(d[query1]))
        .attr('cy', (d) => yScale(d[query2]))

      circles.exit().transition().attr('r', 0).remove()
      if (this.reset) {
        this.svg.call(zoom.transform, d3.zoomIdentity)
        d3.selectAll('.nuplot-selected').classed(
          'nuplot-selected',
          false
        )
        this.$store.dispatch('metamineNU/setSelectedData', [], {
          root: true
        })
        this.$store.dispatch('metamineNU/setReset', false, {
          root: true
        })
      }
    },
    async getKnnData (dataPoint, data) {
      const url = 'https://metamaterials-srv.northwestern.edu./model/'
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({
          dataPoint: [dataPoint],
          data: data.map((d) => [
            d.C11,
            d.C12,
            d.C22,
            d.C16,
            d.C26,
            d.C66
          ])
        })
      }).catch((err) => {
        alert(err.message)
      })
      const { distances, indices } = await response.json()
      return { distances: distances, indices: indices }
    }
  }
}
</script>