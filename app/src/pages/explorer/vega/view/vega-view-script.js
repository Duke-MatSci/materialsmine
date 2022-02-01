import VJsoneditor from 'v-jsoneditor'
import Dialog from '@/components/dialog.vue'
import { getDefaultChart, buildSparqlSpec } from '@/modules/vega-chart'
import { mapGetters } from 'vuex'

export default {
  name: 'chart-view',
  components: {
    MdDialog: Dialog,
    VJsoneditor
  },
  data () {
    return {
      error: { status: false, message: null },
      loading: true,
      spec: null,
      chart: null,
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
      }
    }
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated']),
    specViewerSpec () {
      return this.specViewer.includeData ? this.spec : this.chart && this.chart.baseSpec
    }
  },
  methods: {
    async loadVisualization () {
      this.chart = getDefaultChart()
      this.spec = buildSparqlSpec(this.chart.baseSpec, null)
      this.loading = false
    },
    navBack (args) {
    },
    openVoyager () {
    },
    shareChart () {
    },
    editChart () {
    },
    chartQuery () {
    },
    slugify (args) {
      // return Slug(args)
      return args
    },
    tableView () {
    }
  },
  beforeMount () {
    return this.loadVisualization()
  },
  destroyed () {
    this.error = { status: false, message: null }
  },
  created () {
    this.loading = true
  }
}
