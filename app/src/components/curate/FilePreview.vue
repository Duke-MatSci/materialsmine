<template>
  <component :is="tag" :class="classname">
    <md-list-item>
      <div class="md-layout-item md-size-60 display-text" style="height:2rem">{{fileName}}</div>
      <div class="md-layout-item" >
        <span v-if="customActions">
          <slot name="custom_actions"></slot>
        </span>
        <md-button v-if="showRemove" id="removeFile" class="md-icon-button" @click.native.prevent="$emit('remove', file)">
          <md-tooltip> Remove file </md-tooltip>
          <md-icon>cancel</md-icon>
        </md-button>
      </div>
    </md-list-item>
  </component>
</template>

<script>
export default {
  name: 'FilePreview',
  emits: ['remove'],
  props: {
    file: {
      type: Object,
      required: true
    },
    tag: {
      type: String,
      default: 'li'
    },
    classname: {
      type: String,
      required: false,
      default: ''
    },
    showRemove: {
      required: false,
      default: true
    },
    customActions: {
      required: false,
      default: false
    }
  },
  computed: {
    fileName () {
      return this.file?.file?.name ?? this.file?.name
    }
  }
}
</script>
