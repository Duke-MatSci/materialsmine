<template>
  <div class="chart_editor">
    <div class="u--layout-width viz-sample u--layout-flex utility_flex_mobile" >
      <div v-if="loading" class="editImage_modal" style="z-index:4">
        <spinner :loading="loading"/>
      </div>
     <!-- Left element -->
    <div class="chart_editor__left-view" style="flex: 1 1 50%;">
      <div class="u--layout-width u--layout-flex u--layout-flex-justify-fs u_margin-bottom-small">
        <a @click.prevent="leftTab = 1" :class="[leftTab === 1 ? 'active u--color-primary' : '']" class="viz-tab__button">Sparql</a>
        <a @click.prevent="leftTab = 2" :class="[leftTab === 2 ? 'active u--color-primary' : '']" class="viz-tab__button">Vega</a>
        <a @click.prevent="leftTab = 3" :class="[leftTab === 3 ? 'active u--color-primary' : '']" class="viz-tab__button">Save Chart</a>
      </div>

      <div class="chart_editor__left-content">
        <yasqe
          v-if="chart.query"
          v-model="chart.query"
          v-on:query-success="onQuerySuccess"
          v-show="leftTab === 1" :showBtns='true'>
        </yasqe>
        <v-jsoneditor v-show="leftTab === 2"
          v-model="chart.baseSpec"
          :options="specJsonEditorOpts"
          v-if="chart.baseSpec"
        > </v-jsoneditor>
        <form v-show="leftTab === 3">
          <md-field>
            <label>Title</label>
            <md-input v-model="chart.title"></md-input>
          </md-field>

          <md-field>
            <label>Description</label>
            <md-textarea v-model="chart.description"></md-textarea>
          </md-field>

          <button class="btn btn--primary" @click.prevent="saveChart"> {{ actionType }}  <md-icon class="u--color-success">check</md-icon> </button>
        </form>
      </div>

    </div>

    <!-- The resizer -->
    <div class="u_height--max u--bg-grey u_pointer--ew md-xsmall-hide chart_editor-divider"  id="dragMe"></div>

    <!-- Right element -->
    <div class="chart_editor__right-view" style="flex: 1 1 50%;">
      <h4 class="u--margin-pos">Preview</h4>
      <div class="u--layout-width u--layout-flex u--layout-flex-justify-end u_margin-bottom-small">
        <a @click.prevent="rightTab = 1" :class="[rightTab === 1 ? 'active u--color-primary' : '']" class="viz-tab__button">Chart</a>
        <a @click.prevent="rightTab = 2" :class="[rightTab === 2 ? 'active u--color-primary' : '']" class="viz-tab__button">Table</a>
      </div>

      <div class="chart_editor__right-content">
        <div  v-show="rightTab === 1" class="loading-dialog" style="margin: auto">
          <vega-lite :spec="spec" @new-vega-view="onNewVegaView" class="btn--animated vega-embed-chartview"/>
        </div>

        <div v-show="rightTab === 2"  class="viz-intro-query" style="min-height: 40rem !important">
            <yasr :results="results"></yasr>
        </div>
      </div>
    </div>

    </div>
    <md-button @click="goToExplorer" class="md-fab md-fixed md-fab-bottom-right md-primary btn--primary">
        <md-icon>arrow_back</md-icon>
    </md-button>
  </div>
</template>

<script>
import { querySparql } from '@/modules/sparql'
import { saveChart, getDefaultChart, buildSparqlSpec } from '@/modules/vega-chart'
import VJsoneditor from 'v-jsoneditor'
import VegaLite from '@/components/explorer/VegaLiteWrapper.vue'
import yasqe from '@/components/explorer/yasqe'
import yasr from '@/components/explorer/yasr'
import spinner from '@/components/Spinner'
export default {
  name: 'ChartCreate',
  components: {
    VJsoneditor,
    VegaLite,
    yasqe,
    yasr,
    spinner
  },
  data () {
    return {
      loading: true,
      mouseIsDown: false,
      x: 0,
      y: 0,
      leftTab: 1,
      rightTab: 1,
      results: null,
      specJsonEditorOpts: {
        mode: 'code',
        mainMenuBar: false
      },
      chart: {
        baseSpec: null,
        query: null,
        title: null,
        description: null
      },
      actionType: 'Save Chart'
    }
  },
  computed: {
    spec () {
      const spec = buildSparqlSpec(this.chart.baseSpec, this.results) ?? {}
      return spec
    }
  },
  methods: {
    getSparqlData () {
      const vm = this
      querySparql(vm.chart.query)
        .then(this.onQuerySuccess)
        .then(this.loading = false)
    },
    onQuerySuccess (results) {
      this.results = results
    },
    onSpecJsonError () {
      console.log('bad', arguments)
    },
    async onNewVegaView (view) {
      const blob = await view.toImageURL('png')
        .then(url => fetch(url))
        .then(resp => resp.blob())
      const fr = new FileReader()
      fr.addEventListener('load', () => {
        this.chart.depiction = fr.result
      })
      fr.readAsDataURL(blob)
    },
    async loadChart () {
      // this.types = 'new, edit, restore & delete'
      let getChartPromise
      if (this.$route.params.type === 'new') {
        this.actionType = 'Save Chart'
        getChartPromise = Promise.resolve(getDefaultChart())
      } else if (this.$route.params.type === 'edit') {
        // fetch chart from knowledge graph
        this.actionType = 'Edit Chart'
      } else {
        // Get chart from mongo backup
        this.actionType = 'Restore Chart'
        this.reloadRestored()
      }
      getChartPromise
        .then(chart => {
          this.chart = chart
          return this.getSparqlData()
        })
    },
    async reloadRestored () {
      // 1. Fetch backup from mongo
      // 2. Post each chart (schema + sparql) to knowledge graph
      // 3. Toggle restore flag in mongo

    },
    async saveChart () {
      // Todo (ticket xx): Move this into vuex
      try {
        const chartNanopub = await saveChart(this.chart)
        await this.$store.dispatch('explorer/curation/cacheNewChartResponse', chartNanopub)

        if (this.$route.params.type === 'new') {
          // Save chart to MongoDB - async operation
        } else {
          // Find in mongo and update - async operation
        }
        this.$store.commit('explorer/curation/setNewChartExist', true)

        // Change button name after submission
        this.actionType = 'Edit Chart'
        this.$store.commit('setSnackbar', {
          message: 'Chart saved successfully!',
          duration: 5000
        })
      } catch (err) {
        // TODO (Ticket xxx): USE THE APP DIALOGUE BOX INSTEAD OF ALERT BOX
        return alert(err)
      }
    },
    goToExplorer () {
      this.$router.push('/explorer/chart')
    }
  },
  created () {
    this.loading = true
    this.loadChart()
  }
}
</script>
