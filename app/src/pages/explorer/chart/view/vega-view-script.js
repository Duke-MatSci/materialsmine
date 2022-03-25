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
  props: ['uri'],
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    }),
    specViewerSpec () {
      return this.specViewer.includeData ? this.spec : this.chart && this.chart.baseSpec
    },
    fullUri () {
      return `http://nanomine.org/viz/${this.uri}` // TODO: Change URI to match actual site
    }
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    async loadVisualization () {
      try {
        this.chart = await loadChart(`${this.fullUri}`)
        if (this.chart.query) {
          this.results = await querySparql(this.chart.query)
        }
        this.spec = buildSparqlSpec(this.chart.baseSpec, this.results)
      } catch (e) {
        this.error = { status: true, message: e.message }
      } finally {
        this.loading = false
      }
    },
    navBack (args) {
      this.$router.push('/explorer/chart')
    },
    editChart () {
    },
    renderDialog (title, type, minWidth) {
      this.dialog = {
        title,
        type,
        minWidth
      }
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
