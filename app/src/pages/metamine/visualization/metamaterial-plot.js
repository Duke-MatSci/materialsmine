import spinner from '@/components/Spinner'
import { buildCsvSpec } from '@/modules/vega-chart'
import embed from 'vega-embed'
import { baseSpec, createPatch } from '@/modules/metamine/metamaterial-vegalite'
import { METAMATERIAL_QUERY } from '@/modules/gql/metamaterial-gql'

export default {
  name: 'Mockup',
  components: {
    spinner
  },
  data: () => ({
    loading: false,
    timeout: null,
    spec: null,
    baseSpec: baseSpec,
    error: { status: false, message: null },
    pixelDim: 'TEN',
    xAxis: 'C11',
    yAxis: 'C12',
    pixelData: {},
    // Dictionary so we can add more attributes in the future
    // that might have different attr names than labels
    attributes: [
      { attr: 'C11', label: 'C11' },
      { attr: 'C12', label: 'C12' },
      { attr: 'C22', label: 'C22' },
      { attr: 'C16', label: 'C16' },
      { attr: 'C26', label: 'C26' },
      { attr: 'C66', label: 'C66' }
    ],
    pixelDimOpts: [
      { attr: 'TEN', label: '10 by 10' },
      { attr: 'FIFTY', label: '50 by 50' }
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
    buildSpec () {
      this.spec = buildCsvSpec(this.baseSpec, this.pixelData.data)
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
      } finally {
        this.loading = false
      }
    },
    /**
     * Pause to allow event to register
     */
    changeAxes () {
      this.loading = true
      clearTimeout(this.timeout)
      this.timeout = setTimeout(async () => await this.patchVegaSpec(), 500)
    }
  },
  watch:
    {
      xAxis () {
        this.changeAxes()
      },
      yAxis () {
        this.changeAxes()
      }
    },
  apollo: {
    pixelData: {
      query: METAMATERIAL_QUERY,
      variables () {
        return {
          input: { unitCell: this.pixelDim }
        }
      },
      fetchPolicy: 'cache-and-network',
      result () {
        if (this.pixelData) {
          this.buildSpec()
          this.patchVegaSpec()
        }
      }
    }
  }
}
