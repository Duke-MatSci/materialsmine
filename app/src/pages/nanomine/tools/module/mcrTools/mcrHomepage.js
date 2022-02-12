import ToolCard from '@/components/nanomine/ToolCard'
import ReferenceContainer from '@/components/nanomine/ReferenceContainer'

export default {
  name: 'McrHomepage',
  data: () => ({
    tools: [],
    references: []
  }),
  components: {
    ToolCard,
    ReferenceContainer
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'MCR' })
  },
  mounted () {
    this.tools = this.$store.getters.mcrTools
    this.references = this.$store.getters.mcrReferences
  }
}
