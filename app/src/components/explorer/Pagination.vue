<template>
  <div>
    <div v-if="tpages > 1" class="explorer_page-nav u_margin-top-med viz-pagination-width-mod u_margin-bottom-small">
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
        @click.prevent="goToItem(n + offset)" v-for="(n, i) in lengths" :key="i"
        class="md-button md-icon-button md-dense md-primary"
        :class="isActiveClass(n + offset)"
      >{{ n + offset }}</button>
      <button @click.prevent="nextRow" class="md-button md-icon-button md-dense md-primary u--color-primary" v-if="rowNumber < factor">
        <md-icon class="u--default-size">more_horiz</md-icon>
      </button>
      <button @click.prevent="goToEnd" v-if="rowNumber < factor" class="md-button md-icon-button md-dense md-primary u--color-primary"> {{ tpages }} </button>
    </div>
  </div>

</template>
<script>
import reduceObjList from '@/mixins/reduceObjectList'
export default {
  name: 'pagination',
  mixins: [reduceObjList],
  props: {
    cpage: Number,
    tpages: Number
  },
  data () {
    return {
      itemInput: this.cpage,
      emitMessage: 'go-to-page',
      minLength: 3,
      maxLength: 5
    }
  },
  mounted () {
    if (this.itemExists(this.cpage)) {
      this.verifyRow()
    } else {
      this.goToEnd()
    }
  },
  computed: {
    citem () { return this.cpage },
    titems () { return this.tpages }
  },
  methods: {
    isActiveClass (e) {
      return e === this.itemInput ? 'btn--primary' : 'u--color-primary'
    }
  }
}
</script>
