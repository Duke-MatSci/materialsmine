import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import splitPane from 'vue-splitpane'
import VJsoneditor from 'v-jsoneditor'
import yasqe from '@/components/explorer/yasqe'
import yasr from '@/components/explorer/yasr'

export default {
  name: 'chart-edit',
  props: ['instances'],
  data () {
    return {
      loading: false,
      sparqlError: false,
      showAllTabBtn: false,
      showAllTabs: { display: 'none' },
      paneResize: 18,
      bottomPosition: 'md-bottom-right',
      previewPane: true,
      authenticated: true,
      restoredChartId: null,
      results: null,
      chartPub: null,
      specJsonEditorOpts: {
        mode: 'code',
        mainMenuBar: false
      },
      actionType: 'Save Chart',
      queryEditorReadOnly: false
    }
  },
  computed: {
    ...mapState('vega', ['uri', 'baseSpec', 'query', 'title', 'description', 'depiction']),
    ...mapGetters('vega', ['chart']),
    spec () {
      return null
    }
  },
  components: {
    splitPane,
    VJsoneditor,
    yasqe,
    yasr
  },
  methods: {
    ...mapActions('vega', ['loadChart']),
    ...mapMutations('vega', ['setBaseSpec', 'setQuery', 'setTitle', 'setDescription', 'setDepiction', 'setChart']),
    navBack () {
    },
    resize (e) {
    },
    showTabNavigation () {
    },
    onQuerySuccess (results) {
      this.sparqlError = false
      this.results = results
    },
    onQueryError (error) {
      this.sparqlError = error
      console.warn('SPARQL QUERY ERROR\n', error)
    },
    isSparqlError () {
      return this.sparqlError
    },
    onSpecJsonError () {
      console.log('bad', arguments)
    },
    async onNewVegaView (view) {
    },
    async initializeChart () {
      this.loading = false
    },
    async reloadRestored (args) {
    },
    async saveChart () {
    },
    async postChartBk () {
    },
    defineAction () {
    },
    goToSparqlTemplates () {
    },
    goToDataVoyager () {
    }
  },
  async created () {
    this.defineAction()
    this.initializeChart()
  }
}
