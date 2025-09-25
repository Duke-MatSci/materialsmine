<template>
  <div class="generator-container teams_header-partner tools_laucher">
    <div v-once v-if="isInvalidData"  class="data-error">
      <div v-if="isValidGrid && data">
        Error: expected data string of length {{Math.pow(grid, 2)}}, got {{data.length}}
      </div>
      <div v-else>Error: undefined value provided for grid and/or data property</div>
    </div>
    <div v-if="isValidGrid && data" class="unit-cell-generator grid utility-margin-top" :style="gridStyle">
      <div
        v-for="(value, index) in filledData"
        :key="index"
        :class="{'visualize-pagination-active': parseInt(value), 'unit-cell-generator__grid-item': true}"
        >
      </div>
    </div>
    <div v-else
        class="unit-cell-generator grid utility-margin-top"
        >
        <!-- Error: expected prop grid of type Number, got {{typeof grid}} -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'UnitCellImageGenerator',
  props: ['data', 'grid'],
  computed: {
    isValidGrid () {
      return !!(typeof this.grid === 'number' || this.grid % 2 === 0)
    },
    isInvalidData () {
      if (!this.data) return false
      return this.data.length < Math.pow(this.grid, 2)
    },
    filledData () {
      const missingData = Math.pow(this.grid, 2) - this.data.length
      return missingData ? this.data.concat(Array(missingData).fill(0).join('')) : this.data
    },
    gridStyle () {
      return {
        'grid-template-columns': `repeat(${this.grid}, 1fr)`,
        'grid-template-rows': `repeat(${this.grid}, 1fr)`
      }
    }
  }
}
</script>
