import VJsoneditor from 'v-jsoneditor'
import Dialog from '@/components/dialog.vue'
import { getDefaultChart, buildSparqlSpec } from '@/modules/vega-chart'
import VegaLite from '@/components/explorer/VegaLiteWrapper.vue'
import yasqe from '@/components/explorer/yasqe'
import yasr from '@/components/explorer/yasr'
import spinner from '@/components/Spinner'
import { querySparql } from '@/modules/sparql'

export default {
  name: 'chart-view',
  components: {
    MdDialog: Dialog,
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
      },
      results: null
    }
  },
  computed: {
    specViewerSpec () {
      return this.specViewer.includeData ? this.spec : this.chart && this.chart.baseSpec
    }
  },
  methods: {
    async loadVisualization () {
      this.chart = getDefaultChart() // TODO: Load actual chart
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
  destroyed () {
    this.error = { status: false, message: null }
  },
  created () {
    this.loading = true
    return this.loadVisualization()
  }
}
