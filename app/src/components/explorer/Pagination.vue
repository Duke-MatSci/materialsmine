<template>
  <div class="explorer_page-nav u_margin-top-med viz-pagination-width-mod u_margin-bottom-small">
      <button
        @click.prevent="goToBeginning"
        v-if="rowNumber > 1" :disabled="rowNumber < 1"
        class="md-button md-icon-button md-dense md-primary u--color-primary">1 </button>
      <button
        @click.prevent="prevRow" v-if="rowNumber > 1"
        class="md-button md-icon-button md-dense md-primary u--color-primary">
        <md-icon class="u--default-size">more_horiz</md-icon>
      </button>
      <button
        @click.prevent="goToPage(n + offset)" v-for="(n, i) in lengths" :key="i"
        class="md-button md-icon-button md-dense md-primary"
        :class="isActiveClass(n + offset)"
      >{{ n + offset }}</button>
      <button @click.prevent="nextRow" class="md-button md-icon-button md-dense md-primary u--color-primary" v-if="rowNumber < factor">
        <md-icon class="u--default-size">more_horiz</md-icon>
      </button>
      <button @click.prevent="goToEnd" v-if="rowNumber < factor" class="md-button md-icon-button md-dense md-primary u--color-primary"> {{ tpages }} </button>

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
      pageInput: this.cpage,
      offset: 0,
      rowNumber: 1
    }
  },
  mounted () {
    if (this.pageExists(this.cpage)) {
      this.verifyRow()
    } else {
      this.goToEnd()
    }
  },
  computed: {
    factor () {
      return Math.ceil(this.tpages / this.lengths)
    },
    lengths () {
      if (window.matchMedia('(max-width: 27.5em)').matches) {
        if (this.tpages <= 4) {
          return this.tpages
        }
        return 3
      } else {
        if (this.tpages <= 7) {
          return this.tpages
        }
        return 5
      }
    }
  },
  methods: {
    pageExists (page) {
      return page > 0 && page <= this.tpages
    },
    isActiveClass (e) {
      return e === this.pageInput ? 'btn--primary' : 'u--color-primary'
    },
    verifyRow () {
      if (this.cpage === 1) return
      const limit = this.factor - 1
      const rowNumber = Math.ceil(this.cpage / this.lengths)
      if (this.cpage < this.tpages && rowNumber <= limit) {
        this.offset = (rowNumber - 1) * this.lengths
        this.rowNumber = rowNumber
      } else {
        this.goToLastRow()
      }
    },
    goToBeginning () {
      this.rowNumber = 1
      this.offset = 0
      this.goToPage(1)
    },
    goToLastRow () {
      this.offset = this.tpages - this.lengths
      this.rowNumber = this.factor
    },
    goToEnd () {
      this.goToLastRow()
      this.goToPage(this.tpages)
    },
    goToPage (page) {
      if ((page !== this.cpage) && this.pageExists(page)) {
        this.$emit('go-to-page', page)
        this.pageInput = page
      }
    },
    nextRow () {
      if (this.rowNumber === this.factor) return
      const limit = this.factor - 1
      if (this.rowNumber < limit) {
        this.offset += this.lengths
        this.rowNumber += 1
      } else {
        this.goToLastRow()
      }
    },
    prevRow () {
      if (this.rowNumber === 1) return
      if (this.rowNumber === this.factor) {
        var elem = this.factor
        this.offset = (elem - 2) * this.lengths
        this.rowNumber -= 1
      } else {
        this.offset -= this.lengths
        this.rowNumber -= 1
      }
    }
  }
}
</script>
