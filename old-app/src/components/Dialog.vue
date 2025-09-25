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
        <md-button v-if="!disableClose" class="md-icon-button dialog-box_close facet-content_container u_margin-right-small" @click="toggleDialogBox()">
          <md-icon class="utility-navfonticon u--font-emph-xl">close</md-icon>
        </md-button>
      </div>
      <div class="dialog-box_content">
        <md-dialog-content>
          <slot name="content">
          </slot>
        </md-dialog-content>
      </div>
      <div class="dialog-box_actions md-button-lightbg">
        <md-dialog-actions>
          <slot name="actions">
          </slot>
        </md-dialog-actions>
      </div>
      </md-dialog>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
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
    },
    disableClose: {
      type: Boolean,
      default: false
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
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    })
  }
}
</script>
