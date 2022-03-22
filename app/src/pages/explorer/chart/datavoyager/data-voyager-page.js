import { mapGetters, mapActions, mapMutations } from 'vuex'
// import { Slug } from "../../../../modules";
// import {
//   copyChart,
//   saveChart,
//   transformSparqlData
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
  components: {
    DataVoyager,
    spinner
  },
  computed: {
    ...mapGetters('vega', ['chart']),
    isNewChart () {
    //   return this.pageUri === VIEW_URIS.CHART_EDITOR
      return false
    }
  },
  methods: {
    ...mapActions('vega', ['loadChart']),
    ...mapMutations('vega', ['setBaseSpec']),
    // slugify: Slug,
    async loadData () {
      this.loading = true
      if (!this.isNewChart) {
        await this.loadChart(`http://nanomine.org/viz/${this.$route.params.uri}`)
      }
      const sparqlResults = await querySparql(this.chart.query)
      this.data = { values: parseSparql(sparqlResults) }
      this.loading = false
    },
    saveAsChart () {
    //   this.loading = true;
    //   const newChart = copyChart(this.chart);
    //   newChart.title = `DataVoyager Variant: ${newChart.title}`;
    //   newChart.baseSpec = this.voyagerSpec;
    //   console.log(newChart);
    //   delete newChart.depiction;
    //   saveChart(newChart).then(() =>
    //     goToView(newChart.uri, DEFAULT_VIEWS.EDIT)
    //   );
    },
    selectSpec () {
    //   this.setBaseSpec(this.voyagerSpec)
    //   this.goToChartEditor()
    },
    goToChartView () {
    //   goToView(this.pageUri, DEFAULT_VIEWS.VIEW);
    },
    goToChartEditor () {
    //   goToView(VIEW_URIS.CHART_EDITOR, DEFAULT_VIEWS.NEW);
    },
    goBack () {
    //   if (this.isNewChart) {
    //     this.goToChartEditor()
    //   } else {
    //     this.goToChartView()
    //   }
    }
  },
  mounted () {
    this.loadData()
  }
}
