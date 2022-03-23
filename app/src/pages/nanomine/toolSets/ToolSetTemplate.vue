<template>
  <tool-card class="md-layout-item tool-card md-size-50 md-medium-size-100" v-if="card" :name="name">
    <template v-for="(_, name) in $scopedSlots" :slot="name">
      <slot :name="name" v-if="cardSlots.includes(name)"></slot>
    </template>
  </tool-card>
  <div v-else :class="`section_${name}`" class="wrapper md-layout md-alignment-top-center">
    <div class="team_header md-layout-item md-size-80">
      <h1 class="visualize_header-h1 teams_header">
        <slot name="title"></slot>
      </h1>
    </div>
    <div class="teams_text md-layout-item md-size-80" v-if="$scopedSlots['description']">
      <slot name="description"></slot>
    </div>
    <div class="teams_text md-layout-item md-size-80" v-else>
      <slot name="content"></slot>
    </div>
    <div class="md-layout-item md-size-80 md-layout md-alignment-top-space-between md-gutter">
      <slot name="cards"></slot>
    </div>
  </div>
</template>
<script>
import ToolCard from '@/components/nanomine/ToolCard'

export default {
  name: 'ToolSetTemplate',
  components: {
    ToolCard
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
