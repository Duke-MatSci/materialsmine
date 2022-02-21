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
