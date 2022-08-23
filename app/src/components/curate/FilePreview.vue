<template>
  <component :is="tag" :class="classname">
    <md-list-item>
      <div class="md-layout-item md-size-60 display-text" style="height:2rem">{{file.file.name}}</div>
      <div class="md-layout-item">
        <md-button id="removeFile" class="md-icon-button" @click.native.prevent="$emit('remove', file)">
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
    }
  }
}
</script>
