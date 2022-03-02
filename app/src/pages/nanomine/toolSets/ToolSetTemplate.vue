<template>
  <div :class="`section_${toolSetName}`" :key="toolSetName">
    <tool-card class="md-layout-item tool-card" v-if="card" v-bind="cardContent" :key="card ? cardContent.name : ''"></tool-card>
    <div v-else class="wrapper md-layout md-alignment-top-center">
      <div class="team_header md-layout-item md-size-80">
        <h1 class="visualize_header-h1 teams_header">{{ pageContent.title }}</h1>
      </div>
      <div class="teams_text md-layout-item md-size-80">
        {{ pageContent.text }}
      </div>

      <div class="md-layout-item md-size-80 md-layout md-alignment-top-space-around md-gutter tool-card">
        <component class="md-layout-item" v-for="tool of toolCards" v-bind:is="tool" :key="tool" card></component>
      </div>

      <div class="md-layout-item md-size-80 md-layout md-alignment-top-left reference-container" v-if="pageContent.references">
        <reference-container :references="pageContent.references" :openOnLoad="false"></reference-container>
      </div>
    </div>
  </div>
</template>
<script>
import ToolCard from '@/components/nanomine/ToolCard'
import ReferenceContainer from '@/components/nanomine/ReferenceContainer'
import ToolComponents from '../tools'
import ToolSetComponents from '.'

export default {
  name: 'tool-set-template',
  components: {
    ToolCard,
    ReferenceContainer,
    ...ToolComponents,
    ...ToolSetComponents
  },
  props: {
    pageContent: {
      type: Object,
      required: true
    },
    card: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data: function () {
    return {}
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'Tools' })
  },
  computed: {
    toolSetName: function () {
      return this.pageContent.name || ''
    },
    cardContent: function () {
      return {
        ...this.pageContent,
        text: this.pageContent.description
      }
    },
    toolCards: function () {
      const toolsList = []
      if (this.pageContent.tools) {
        toolsList.push(...this.pageContent.tools)
      }
      if (this.pageContent.toolSets) {
        toolsList.push(...this.pageContent.toolSets)
      }
      return toolsList
    }
  }
}
</script>
