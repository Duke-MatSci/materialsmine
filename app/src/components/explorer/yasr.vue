<template>
    <div :id="id"></div>
</template>

<script>
import YASR from '@triply/yasr'

export default {
  name: 'yasr',
  props: {
    id: {
      type: String,
      default: () => 'YASR'
    },
    results: {
      type: Object,
      default: () => null
    }
  },
  methods: {
    setResults (results) {
      if (results) {
        this.yasr.setResponse(results)
      }
    }
  },
  mounted () {
    this.yasr = new YASR(this.$el, {
      outputPlugins: ['table'],
      useGoogleCharts: false,
      persistency: {
        results: {
          key: () => false
        }
      }
    })
    this.setResults(this.results)
  },
  watch: {
    results (newVal, oldVal) {
      this.setResults(newVal)
    }
  }
}
</script>

<style css src='@triply/yasr/build/yasr.min.css'>
</style>
