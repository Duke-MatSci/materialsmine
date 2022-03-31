import { mapGetters, mapActions, mapMutations } from 'vuex'
// import {
//   copyChart,
//   saveChart
// } from "@/modules/vega-chart";
import { querySparql, parseSparql } from '@/modules/sparql'
import DataVoyager from '@/components/explorer/DataVoyager'
import spinner from '@/components/Spinner'

export default {
  data () {
    return {
      loading: true,
      voyagerSpec: null,
      specJsonEditorOpts: {
        mode: 'code',
        mainMenuBar: false
      }
    }
  },
  props: ['chartId'],
  components: {
    DataVoyager,
    spinner
  },
  computed: {
    ...mapGetters('vega', ['chart']),
    isNewChart () {
    // TODO: Add ability to create new charts from datavoyager once new chart pipeline is set up
      return false
    }
  },
  methods: {
    ...mapActions('vega', ['loadChart']),
    ...mapMutations('vega', ['setBaseSpec']),
    async loadData () {
      this.loading = true
      if (!this.isNewChart) {
        await this.loadChart(`http://nanomine.org/viz/${this.chartId}`) // TODO: Update uri
      }
      const sparqlResults = await querySparql(this.chart.query)
      this.data = { values: parseSparql(sparqlResults) }
      this.loading = false
    },
    saveAsChart () {
    // TODO: add once pipeline for creating new charts is set up
    },
    selectSpec () {
    // //TODO: Will be called from saveAsChart
    //   this.setBaseSpec(this.voyagerSpec)
    //   this.goToChartEditor()
    },
    goToChartView () {
      this.$router.push(`/explorer/chart/view/${this.chartId}`)
    },
    goToChartEditor () {
    // TODO: Link to chart editor once exists
    },
    navBack () {
      if (this.isNewChart) {
        this.goToChartEditor()
      } else {
        this.goToChartView()
      }
    }
  },
  mounted () {
    this.loadData()
  }
}
