<template>
  <tool-card class="md-layout-item tool-card" v-if="card" v-bind="tool" :key="card ? tool.name : ''"></tool-card>
  <div class="md-layout" v-else>
    <div class="md-layout-item md-size-100">
      <slot class="md-layout-item md-size-100">
        Tool page to come.
      </slot>
    </div>
    <div class="md-layout-item md-size-80 md-layout md-alignment-top-center reference-container">
      <reference-container
        :references="tool.references"
        :openOnLoad="false"
      ></reference-container>
    </div>
  </div>
</template>

<script>
import ToolCard from '@/components/nanomine/ToolCard'
import ReferenceContainer from '@/components/nanomine/ReferenceContainer'
export default {
  name: 'ToolBase',
  components: {
    ToolCard,
    ReferenceContainer
  },
  props: {
    tool: {
      type: Object,
      required: true
    },
    card: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'Tools' })
  }
}
</script>
