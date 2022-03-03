<template>

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
