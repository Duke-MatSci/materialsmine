<template>
<div class="md-layout section_LineChart">
  <div
    class="md-layout-item md-size-20 md-alignment-top-left md-layout md-gutter"
  >
    <div class="md-layout-item">
      <md-switch v-model="xLogScale" class="md-layout-item md-size-100"
        >x Axis Log Scale</md-switch
      >
      <md-switch v-model="yLogScale" class="md-layout-item md-size-100"
        >y Axis Log Scale</md-switch
      >
    </div>
  </div>
  <div class="md-layout-item">
    <svg
      :width="width + margin.left + margin.right"
      :height="height + margin.top + margin.bottom"
      class="nm-linechart"
    >
      <g :transform="`translate(${margin.left + 3}, ${10})`">
        <!-- Axes -->
        <g class="x-axis" :transform="`translate(0, ${height})`"></g>
        <g class="y-axis"></g>
        <!-- Axis Labels -->
        <g>
          <text
            class="x-axis-label"
            :transform="`translate(${width/2}, ${height+margin.top+20})`"
            style="text-anchor: middle"
          ></text>
          <text
            class="y-axis-label"
            :transform="`rotate(-90)`"
            :y="`${0 - margin.left}`"
            :x="`${0 - (height/2)}`"
            :dy="`1em`"
            style="text-anchor: middle"
          ></text>
        </g>
        <!-- Line -->
        <g>
          <path class="nm-line" d=""></path>
        </g>
      </g>
    </svg>
  </div>
</div>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'LineChart',
  data () {
    return {
      width: 0,
      height: 0,
      margin: {
        left: 70,
        right: 40,
        bottom: 50,
        top: 40
      },
      scales: {
        x: null,
        y: null
      },
      data: [],
      xlabel: '',
      ylabel: '',
      xLogScale: false,
      yLogScale: false
    }
  },
  props: {
    dataset: {
      type: Object,
      required: true
    },
    options: {
      type: Object
    }
  },
  methods: {
    /**
     * setSize: This method will set the width, height
     * and also the margins of the chart.
     */
    setSize () {
      // Width and Height
      this.width =
        this.options.width || 400 - this.margin.left - this.margin.right
      this.height =
        this.options.height || 250 - this.margin.top - this.margin.top
    },
    setScales () {
      if (!this.xLogScale) {
        this.scales.x = d3
          .scaleLinear()
          .domain(d3.extent(this.data, d => d.x))
          .range([0, this.width])
      } else {
        this.scales.x = d3
          .scaleLog()
          .domain(d3.extent(this.data, d => d.x))
          .range([0, this.width])
      }

      if (!this.yLogScale) {
        this.scales.y = d3
          .scaleLinear()
          .domain(d3.extent(this.data, d => d.y))
          .range([this.height, 0])
      } else {
        this.scales.y = d3
          .scaleLog()
          .domain(d3.extent(this.data, d => d.y))
          .range([this.height, 0])
      }
    },
    renderAxes (strokeColor) {
      d3.select('.x-axis')
        .call(d3.axisBottom(this.scales.x).ticks(7))
        .selectAll('.tick line')
        .attr('stroke', strokeColor)
        .attr('stroke-opacity', '0.8')

      d3.select('.y-axis')
        .call(d3.axisLeft(this.scales.y).ticks(5))
        .selectAll('.tick line')
        .attr('stroke', strokeColor)
        .attr('stroke-opacity', '0.8')

      // Change axis label text
      d3.select('.x-axis-label')
        .text(this.xlabel)
      d3.select('.y-axis-label')
        .text(this.ylabel)

      // Change text color
      d3.selectAll('.y-axis text').attr('color', strokeColor)
      d3.selectAll('.x-axis text').attr('color', strokeColor)

      // Change path color
      d3.selectAll('.y-axis path')
        .attr('stroke', strokeColor)
        .attr('stroke-opacity', '0.8')
      d3.selectAll('.x-axis path')
        .attr('stroke', strokeColor)
        .attr('stroke-opacity', '0.8')
    },
    line () {
      const { x, y } = this.scales
      return d3
        .line()
        .x(d => x(d.x))
        .y(d => y(d.y))
    },
    renderLine () {
      d3.select('.nm-line')
        .datum(this.data)
        .attr('d', this.line())
    },
    init () {
      if (this.data?.length > 0) {
        const strokeColor = '#000'
        this.setSize()
        this.setScales()
        this.renderAxes(strokeColor)
        this.renderLine()
      }
    }
  },
  watch: {
    /**
     * Re-render the chart on data change
     */
    dataset (data) {
      this.data = data.data
      this.xlabel = data.xlabel
      this.ylabel = data.ylabel
      this.init()
    },
    xLogScale (data) {
      this.init()
    },
    yLogScale (data) {
      this.init()
    }
  },
  mounted () {
    this.data = this.dataset.data
    this.xlabel = this.dataset.xlabel
    this.ylabel = this.dataset.ylabel
    this.init()
  }
}
</script>
