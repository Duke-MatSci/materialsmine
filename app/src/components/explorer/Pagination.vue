<template>
  <div class="viz-pagination-container">
    <span>Page {{ cpage }} of {{ tpages }}</span>
    <div class="viz-pagination">
      <button
        :disabled="cpage <= 1"
        @click.prevent="goToPage(1)"
        class="pagination-button pagination-button-home"
      >Home</button>
      <button
        :disabled="cpage <= 1"
        @click.prevent="goToPage(cpage - 1)"
        class="pagination-button pagination-button-prev"
      >Prev</button>
      <button
        :disabled="cpage >= tpages"
        @click.prevent="goToPage(cpage + 1)"
        class="pagination-button pagination-button-next"
      >Next</button>
      <button
        :disabled="cpage >= tpages"
        @click.prevent="goToPage(tpages)"
        class="pagination-button pagination-button-end"
      >End</button>
    </div>
  </div>
</template>
<script>
export default {
  name: 'pagination',
  props: {
    cpage: Number,
    tpages: Number
  },
  methods: {
    goToPage (page) {
      if (page !== this.cpage) {
        this.$emit('go-to-page', page)
      }
    },
    pageExists (page) {
      return page > 0 && page <= this.tpages
    }
  }
}
</script>
