<template>
<div>
<div v-if="!hideButton" v-on:click="showDialog=!showDialog" >
        <slot name="button">
            <!--Default button -->
            <md-button>
                Dialog
            <md-tooltip>Toggle dialog</md-tooltip>
            </md-button>
        </slot>
    </div>
<md-dialog :md-active.sync="showDialog">
    <md-dialog-title>
        {{title}}
    </md-dialog-title>
    <div class="dialog-box_content">
        <slot name="content">
            <!--Default content -->
            Dialog content
        </slot>
    </div>
    <md-dialog-actions>
        <slot name="actions">
            <!--Default action -->
            <md-button class="md-primary" @click="showDialog = false">Close</md-button>
        </slot>
    </md-dialog-actions>
</md-dialog>
</div>
</template>

<script>
export default {
  name: 'Dialog',
  props: {
    hideButton: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Dialog Box'
    }
  },
  data () {
    return {
      showDialog: false
    }
  }
}
</script>
