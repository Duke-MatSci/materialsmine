<template>
<div class="accordion u_margin-bottom-small u_margin-top-small">
  <div @click="toggleOpen">
    <md-toolbar :class="'md-dense md-toolbar_adjust u--padding-zero u_margin-bottom-small u_margin-top-small'">
      <div class="u_display-flex accordion-toolbar-row" style="justify-content: flex-start">
        <h4 class="md-title u_margin-none" style="font-size:16px" >{{title}}</h4>
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
export default {
  name: 'expandableTree',
  props: {
    startOpen: {
      type: Boolean,
      default: () => false
    },
    title: {
      type: String
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

}
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
