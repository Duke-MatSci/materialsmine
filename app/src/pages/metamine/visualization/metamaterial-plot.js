import VegaLite from '@/components/explorer/VegaLiteWrapper.vue'
import spinner from '@/components/Spinner'
import { buildCsvSpec } from '../../../modules/vega-chart'
import embed from 'vega-embed'
import { baseSpec, createPatch } from '../../../modules/metamine/metamaterial-vega-spec'

export default {
  name: 'Mockup',
  components: {
    VegaLite,
    spinner
  },
  data: () => ({
    spec: null,
    baseSpec: baseSpec,
    loading: false,
    error: { status: false, message: null },
    results: null,
    xAxis: 'C11',
    yAxis: 'C12',
    patchSpec: {},
    // Dictionary so we can add more attributes in the future
    // that might have different attr names than labels
    attributes: [
      { attr: 'C11', label: 'C11' },
      { attr: 'C12', label: 'C12' },
      { attr: 'C22', label: 'C22' },
      { attr: 'C16', label: 'C16' },
      { attr: 'C26', label: 'C26' },
      { attr: 'C66', label: 'C66' }
    ]
  }),
  computed: {
    // Don't allow graphing the same property against itself (causes vega-lite errors)
    xAxisOpts () {
      return this.attributes.filter(attr => attr.label !== this.yAxis)
    },
    yAxisOpts () {
      return this.attributes.filter(attr => attr.label !== this.xAxis)
    }
  },
  methods: {
    async loadVisualization () {
      try {
        this.spec = buildCsvSpec(this.baseSpec, this.results)
      } catch (e) {
        this.error = { status: true, message: e.message }
      } finally {
        this.loading = false
      }
    },
    // TODO: remove this method. Should happen server side!
    async CSVToJSON (delimiter = ',') {
      const requestOptions = {
        headers: {
          accept: 'application/sparql-results+json'
        }
      }
      // TODO: Change to Apollo GraphQL
      return await fetch('../metamaterials_combined_1000.csv', requestOptions)
        .then(response => response.text())
        .then(data => {
          const titles = data.slice(0, data.indexOf('\n')).split(delimiter).map(str => str.replace(/^"(.*)"$/, '$1'))
          this.results = data
            .slice(data.indexOf('\n') + 1)
            .split('\n')
            .map(v => {
              const values = v.split(delimiter).map(str => str.replace(/^"(.*)"$/, '$1'))
              return titles.reduce(
                (obj, title, index) => (((obj[title] = values[index]), obj)),
                {})
            })
        })
    },
    // Handle screen resizing
    alignVegaTooltips () {
      const canvas = document.getElementsByClassName('marks')[0]
      const vegaBindings = document.getElementsByClassName('vega-bindings')[0]
      vegaBindings.style.width = canvas.style.width
    },
    // Enables dynamic bindings
    async patchVegaSpec () {
      try {
        await embed('#vegaembed', this.spec, createPatch(this.xAxis, this.yAxis))
          .then(() => this.alignVegaTooltips())
      } catch (e) {
        this.error = { status: true, message: e.message }
      }
    }
  },
  created () {
    this.loading = true
    this.CSVToJSON()
      .then(() => this.loadVisualization())
      .then(async () => await this.patchVegaSpec())
  },
  watch: {
    async xAxis () {
      await this.patchVegaSpec()
    },
    async yAxis () {
      await this.patchVegaSpec()
    }

  }
}
