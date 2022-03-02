<template>
  <div :class="`section_${toolName}`" :key="tool">
    <div class="wrapper md-layout md-alignment-top-center">
      <div class="team_header md-layout-item md-size-80">
        <h1 class="visualize_header-h1 teams_header">{{ pageContent.title }}</h1>
      </div>
      <div class="teams_text md-layout-item md-size-80">
        {{ pageContent.text }}
      </div>

      <div class="md-layout-item md-size-80 md-layout md-alignment-top-space-around md-gutter tool-card">
        <tool-card class="md-layout-item" v-for="card of pageContent.cards" v-bind="card" :key="card.name"></tool-card>
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

export default {
  name: 'ToolSetTemplate',
  components: {
    ToolCard,
    ReferenceContainer
  },
  props: {
    toolProp: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      pageContent: {}
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'Tools' })
  },
  mounted () {
    this.getPageContent()
  },
  computed: {
    tool: function () {
      return this.toolProp
    },
    toolName: function () {
      if (this.pageContent) {
        return this.pageContent.name || ''
      } else {
        return this.toolProp
      }
    }
  },
  methods: {
    getPageContent () {
      this.pageContent = this.$store.getters[`${this.tool}/pageContent`]
    }
  },
  watch: {
    $route (to, from) {
      this.getPageContent()
    }
  }
}

</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  img {
    width: 240px;
  }
  h3 {
    color: #096ff4;
  }
  h4 {
    text-transform: uppercase;
  }
</style>
