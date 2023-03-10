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
/* .yasgui .autocompleteWrapper {
    display: none !important;
  } */
</style>
