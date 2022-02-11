import ToolCard from '@/components/nanomine/ToolCard'

export default {
  name: 'ModuleTools',
  components: {
    ToolCard
  },
  data: () => {
    return {
      tools: []
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'Tools' })
  },
  mounted () {
    this.tools = this.$store.getters.moduleTools
  }
}
