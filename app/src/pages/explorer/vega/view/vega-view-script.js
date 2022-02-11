import VJsoneditor from 'v-jsoneditor'
import Dialog from '@/components/Dialog.vue'
import { loadChart, buildSparqlSpec } from '@/modules/vega-chart'
import VegaLite from '@/components/explorer/VegaLiteWrapper.vue'
import yasqe from '@/components/explorer/yasqe'
import yasr from '@/components/explorer/yasr'
import spinner from '@/components/Spinner'
import { querySparql } from '@/modules/sparql'
import { mapMutations, mapGetters } from 'vuex'

export default {
  name: 'chart-view',
  components: {
    dialogbox: Dialog,
    VJsoneditor,
    VegaLite,
    yasqe,
    yasr,
    spinner
  },
  data () {
    return {
      error: { status: false, message: null },
      loading: true,
      spec: null,
      chart: {},
      chartTags: [],
      args: null,
      allowEdit: false,
      vizOfTheDay: false,
      voyager: {
        show: false
      },
      specViewer: {
        show: false,
        includeData: false,
        jsonEditorOpts: {
          mode: 'code',
          mainMenuBar: false,
          onEditable: () => false
        }
      },
      results: null,
      dialog: {
        title: ''
      }
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    }),
    specViewerSpec () {
      return this.specViewer.includeData ? this.spec : this.chart && this.chart.baseSpec
    },
    pageUri () {
      return `http://nanomine.org/viz/${this.$route.params.uri}` // TODO: Change URI to match actual site
    }
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    async loadVisualization () {
      this.chart = await loadChart(`${this.pageUri}`)
      if (this.chart.query) {
        this.results = await querySparql(this.chart.query)
      }
      this.spec = buildSparqlSpec(this.chart.baseSpec, this.results)
      this.loading = false
    },
    navBack (args) {
    },
    openVoyager () {
    },
    editChart () {
    },
    renderDialog (title, type) {
      this.dialog.title = title
      this.dialog.type = type
      this.toggleDialogBox()
    },
    slugify (args) {
      // return Slug(args)
      return args
    }
  },
  destroyed () {
    this.error = { status: false, message: null }
  },
  created () {
    this.loading = true
    return this.loadVisualization()
  }
}
