import ToolCard from '@/components/nanomine/ToolCard'
import ReferenceContainer from '@/components/nanomine/ReferenceContainer'

export default {
  name: 'ModuleTools',
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
  data: () => {
    return {
      pageContent: {}
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'Tools' })
  },
  mounted () {
    this.pageContent = this.$store.getters[`${this.tool}/pageContent`]
  },
  computed: {
    tool: function () {
      return this.toolProp
    }
  }
}
