<template>
  <div>
    <div :id="containerId" :ref="containerId"></div>
  </div>
</template>

<script>
import { CreateVoyager } from 'datavoyager'

const voyagerConf = {
  showDataSourceSelector: false,
  hideHeader: true,
  hideFooter: true
}

export default {
  name: 'DataVoyager',
  data () {
    return {
      containerId: 'voyager-embed'
    }
  },
  props: {
    data: {
      type: Object,
      default: () => null
    },
    spec: {
      type: Object,
      default: () => null
    }
  },
  methods: {
    updateSpec () {
      this.$emit('update:spec', this.voyagerInstance.getSpec())
    },
    createVoyager () {
      const container = this.$refs[this.containerId]
      this.voyagerInstance = CreateVoyager(container, voyagerConf, undefined)
      this.voyagerInstance.onStateChange(() => this.updateSpec())
      this.voyagerInstance.updateData(this.data)
    }
  },
  watch: {
    data () {
      this.createVoyager()
    }
  },
  mounted () {
    this.createVoyager()
  }
}
</script>

<style css src='datavoyager/build/style.css'>
</style>
