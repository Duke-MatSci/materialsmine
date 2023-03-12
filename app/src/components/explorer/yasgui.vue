<template>
  <div :id="id"></div>
</template>

<script>
import YASGUI from '@triply/yasgui'

export default {
  name: 'yasgui',
  props: {
    id: {
      type: String,
      default: () => 'YASGUI'
    }
  },
  mounted () {
    this.yasgui = new YASGUI(this.$el, {

      requestConfig: {
        endpoint: '/api/knowledge/sparql'
      },
      copyEndpointOnNewTab: false
    })
  }
}
</script>

<style css src='@triply/yasgui/build/yasgui.min.css'></style>

<style css>
  .yasgui .endpointText {
    display: none !important;
  }
  .yasgui .autocompleteWrapper,
  .yasgui .controlbar {
    visibility: hidden !important;
    display: none !important;
  }
  .yasqe .CodeMirror {
    border: 1px solid #afe3f1 !important;
  }
  .CodeMirror-gutters {
    border-right: 1px solid #afe3f1 !important;
    background-color: #f7f7f7;
    white-space: nowrap;
  }
</style>
