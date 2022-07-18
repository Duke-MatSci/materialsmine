<template>
  <div>
    <md-dialog :class="['dialog-box', dialogSizeClass]"
      :md-active.sync="active"
      :md-click-outside-to-close="false">
      <div class="dialog-box_header">
        <md-dialog-title>
          <slot name="title">
          </slot>
        </md-dialog-title>
      </div>
      <div class="dialog-box_content">
        <md-dialog-content>
          <slot name="content">
          </slot>
        </md-dialog-content>
      </div>
      <div class="dialog-box_actions">
        <md-dialog-actions>
          <slot name="actions">
          </slot>
        </md-dialog-actions>
      </div>
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
    minWidth: {
      type: Number,
      default: 60
    }
  },
  computed: {
    dialogSizeClass () {
      return ({
        40: 'dialog-box_size-sm',
        60: 'dialog-box_size-md',
        80: 'dialog-box_size-lg'
      })[this.minWidth] || 'dialog-box_size-md'
    }
  }
}
</script>
