<template>
<div class="accordion">
  <div @click="toggleOpen">
    <md-toolbar :class="dense ? 'md-dense' :'md-toolbar_adjust u--padding-zero'">
      <div class="u_display-flex accordion-toolbar-row viz-sample__header">
        <h4 v-if="dense" class="md-subheader">{{title}}</h4>
        <h3 v-else class="md-title">{{title}}</h3>
        <div class="accordion-icons">
          <md-icon v-show="!open">
            expand_more
          </md-icon>
          <md-icon v-show="open">
            expand_less
          </md-icon>
        </div>
      </div>
    </md-toolbar>
  </div>
  <div class="accordion-content" v-if="open">
    <slot></slot>
  </div>
</div>
</template>
<script>
import Vue from 'vue'

export default Vue.component('accordion', {
  name: 'accordion',
  props: {
    startOpen: {
      type: Boolean,
      default: () => false
    },
    title: {
      type: String
    },
    dense: {
      type: Boolean,
      default: () => false
    }
  },
  data () {
    return {
      open: this.startOpen
    }
  },
  methods: {
    toggleOpen () {
      this.open = !this.open
    }
  }

})
</script>

<style scoped>
.accordion-content {
  overflow: auto
}
.accordion-toolbar-row {
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.accordion .viz-sample__header, .accordion .md-dense {
  cursor: pointer;
}
</style>
