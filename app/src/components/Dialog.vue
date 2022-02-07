<template>
  <div>
    <md-dialog
      :md-active.sync="active"
      :md-click-outside-to-close="false">
      <slot></slot>
      </md-dialog>
  </div>
</template>

<script>
export default {
  name: 'Dialog',
  props: {
    active: {
      type: Boolean,
      default: false
    },
  }
}
</script>
