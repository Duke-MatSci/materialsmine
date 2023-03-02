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
        endpoint: '/sparql'
      },
      copyEndpointOnNewTab: false

      /// // NOTE: these aren't required, but were used in the whyis configuration
      // yasqe:{
      //   sparql:{
      //     endpoint:'/sparql',
      //     requestMethod: "POST"
      //   }
      // },
      // yasr : {
      //   table : {
      //     fetchTitlesFromPrefLabel : true
      //   }
      // }
    })
  }
}
</script>

<style css src='@triply/yasgui/build/yasgui.min.css'>
.yasgui .endpointText {
    display:none !important;
}
.yasgui .autocompleteWrapper {
    display: none !important;
  }
</style>
