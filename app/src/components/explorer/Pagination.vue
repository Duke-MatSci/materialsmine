<template>
  <div class="viz-pagination-container">
    <span class="viz-pagination u_centralize_content">
      <div class="pagination-field">
         Page
      </div>
      <md-field :class="pgInputClass" class="u_width--small">
        <md-input id="pageInput" v-model="pageInput" @change="goToPage($event.target.value)" required></md-input>
        <span class="md-error">Out of range</span>
      </md-field>
      <div class="pagination-field">
       of {{ tpages }}
       </div>
    </span>
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
  data () {
    return {
      pageInput: this.cpage
    }
  },
  computed: {
    pgInputClass () {
      return {
        'md-invalid': !this.pageExists(this.pageInput)
      }
    }
  },
  methods: {
    goToPage (page) {
      if ((page !== this.cpage) && this.pageExists(page)) {
        this.$emit('go-to-page', page)
        this.pageInput = page
      }
    },
    pageExists (page) {
      return page > 0 && page <= this.tpages
    }
  }
}
</script>
