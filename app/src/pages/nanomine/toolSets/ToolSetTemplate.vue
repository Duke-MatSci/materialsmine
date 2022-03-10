<template>
  <tool-card class="md-layout-item tool-card" v-if="card" :name="name">
    <template v-for="(_, slotName) in $scopedSlots" :slot="slotName">
      <slot :name="slotName" v-if="cardSlots.includes(name)"></slot>
    </template>
  </tool-card>
  <div v-else :class="`section_${name}`" class="wrapper md-layout md-alignment-top-center">
    <div class="team_header md-layout-item md-size-80">
      <h1 class="visualize_header-h1 teams_header">
        <slot name="title"></slot>
      </h1>
    </div>
    <div class="teams_text md-layout-item md-size-80">
      <slot name="content"></slot>
    </div>
    <div class="md-layout-item md-size-80 md-layout md-alignment-top-space-around md-gutter">
      <slot name="cards"></slot>
    </div>
  </div>
</template>
<script>
import ToolCard from '@/components/nanomine/ToolCard'
import ToolComponents from '../tools'
import ToolSetComponents from '.'

export default {
  name: 'tool-set-template',
  components: {
    ToolCard,
    ...ToolComponents,
    ...ToolSetComponents
  },
  props: {
    card: {
      type: Boolean,
      required: false,
      default: false
    },
    name: {
      type: String,
      required: true
    },
    header: {
      type: String,
      required: false
    }
  },
  data: function () {
    return {
      cardSlots: ['image', 'title', 'content', 'actions']
    }
  },
  mounted () {
    if (!this.card && this.header) {
      this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: this.header })
    }
  }
}
</script>
