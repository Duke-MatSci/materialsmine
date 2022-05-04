<template>
<div class="accordion">
  <div @click="toggleOpen">
    <md-toolbar :class="dense ? 'md-dense' :''">
      <div class="accordion-toolbar-row">
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
    },
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
  max-height: 40vh;
  overflow: auto
}
.accordion-toolbar-row {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.accordion .md-toolbar:hover {
  cursor: pointer;
}
</style>
