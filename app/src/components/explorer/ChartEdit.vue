<template>
  <div class="">
    <div class="utility-content__result">
      <div class="utility-gridicon-single" v-if="!loading">
      </div>
    </div>

    <split-pane
      :min-percent='paneResize'
      :default-percent='50'
      split="vertical"
      class="splitpane">
        <template slot="paneL">
          <div class="splitpane_panel">
            <md-tabs class="vega-tabs">
            <md-tab id="tab-sparql" class="viz-editor-tabs-item tabselected" md-label="Sparql" style="color:$primary-black !important">
                <yasqe
                    :value="query"
                    :readOnly="queryEditorReadOnly"
                    @input="setQuery"
                    @query-success="onQuerySuccess"
                    @query-error="onQueryError"
                />
            </md-tab>
            <md-tab id="tab-vega" md-label="Vega">
                <v-jsoneditor v-if="baseSpec"
                :value="baseSpec"
                @input="setBaseSpec"
                :options="specJsonEditorOpts"
                :error="onSpecJsonError"
                :height="'40rem'"
                >
                </v-jsoneditor>
            </md-tab>
            <md-tab id="tab-chart" md-label="Save Chart">
                <div>
                    <form class="title-form" @submit.prevent="saveChart">
                        <div style="display: block; flex: 1">
                        <md-field class="chart-title-field viz-u-maxwidth">
                            <label for="chart-title">Title</label>
                            <md-input name="chart-title" id="chart-title" :value="title" @input="setTitle"/>
                        </md-field>
                        </div>
                        <div style="display: block;">
                        <md-field class="chart-description-field viz-u-maxwidth">
                            <label for="chart-description">Description</label>
                            <md-textarea name="chart-description" id="chart-description" :value="description" @input="setDescription"/>
                        </md-field>
                        </div>
                        <div style="display: block;">
                        <button type="submit" class="btn btn--primary">{{ actionType }} <md-icon style="color:#32CD32">check</md-icon></button>
                        </div>
                    </form>
                </div>
            </md-tab>
            </md-tabs>
          </div>
        </template>
        <template slot="paneR">
          <div class="splitpane_panel">
            <md-tabs class="vega-tabs">
              <md-tab id="tab-yasr" md-label="Data">
                <div v-if="sparqlError" style="color:red; text-align:center;"><b>Error: SPARQL Request Failed</b></div>
                <yasr v-bind:results="results"></yasr>
              </md-tab>
              <md-tab id="tab-chart" md-label="Chart">
                <img src="https://www.seekpng.com/png/detail/238-2383560_clipart-stock-transparent-graph-cartoon-graph-icon-creative.png" style="height:50rem"/>
              </md-tab>
            </md-tabs>
          </div>
        </template>
    </split-pane>
</div>
</template>

<script>
import Vue from 'vue'
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import splitPane from 'vue-splitpane'
import VJsoneditor from 'v-jsoneditor'
import yasqe from '@/components/yasqe'
import yasr from '@/components/yasr'

export default Vue.component('chart-editor', {
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
})

</script>
