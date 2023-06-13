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
    const token = this.$store.getters['auth/token']
    this.yasgui = new YASGUI(this.$el, {

      requestConfig: {
        endpoint: '/api/knowledge/sparql',
        headers: () => ({
          authorization: 'Bearer ' + token
        })
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
  .yasgui > .tabsList > .tab > a {
    font-weight: 300;
    color: #08233c !important;
  }
  .yasgui .tabsList .tab:hover > a,
  .yasgui .tabsList .tab.active > a {
    text-decoration: none;
    color: #0e5f76 !important;
    border: none !important;
    border-bottom: 2px solid #afe3f1 !important;
  }
  .yasgui > .tabsList > .tab > a > div.closeTab {
    color: #08233c !important;
    opacity: 0.7 !important;
  }
  .yasgui > .tabsList > .tab.active > a > div.closeTab {
    color: #08233c !important;
    opacity: 1 !important;
  }
</style>
