<template>
  <div>
    <div class="utility-content__result">
      <div class="utility-gridicon" v-if="!loading">
        <div>
          <md-button class="md-icon-button" @click.native.prevent="navBack">
            <md-tooltip> Go Back </md-tooltip>
            <md-icon>arrow_back</md-icon>
          </md-button>
        </div>
        <div>
            <mdDialog :title="'Share Chart'">
                <template v-slot:button>
                    <md-button class="md-icon-button">
                        <md-tooltip> Share Chart </md-tooltip>
                        <md-icon>share</md-icon>
                    </md-button>
                </template>
                <template v-slot:content>
                    Link to chart
                </template>
            </mdDialog>
        </div>
        <div v-if="chart.query">
            <mdDialog :title="'Preview Chart Query'">
                <template v-slot:button>
                    <md-button class="md-icon-button">
                        <md-tooltip> Preview Chart Query </md-tooltip>
                        <md-icon>preview</md-icon>
                    </md-button>
                </template>
                <template v-slot:content>
                    Query goes here
                </template>
            </mdDialog>
        </div>
        <div>
            <mdDialog :title="'View Data as Table'">
                <template v-slot:button>
                    <md-button class="md-icon-button">
                        <md-tooltip> View Data as Table </md-tooltip>
                        <md-icon>table_view</md-icon>
                    </md-button>
                </template>
                <template v-slot:content>
                    Data
                </template>
            </mdDialog>
        </div>
        <div>
            <mdDialog :title="'Chart Vega Spec'">
                <template v-slot:button>
                    <md-button class="md-icon-button">
                        <md-tooltip> Preview Chart Spec </md-tooltip>
                        <md-icon>integration_instructions</md-icon>
                    </md-button>
                </template>
                <template v-slot:content>
                    <md-content>
                    <v-jsoneditor
                        v-model="specViewerSpec"
                        :options="specViewer.jsonEditorOpts"
                    >
                    </v-jsoneditor>
                    </md-content>
                    <div class="vega-spec-controls">
                        <md-checkbox v-model="specViewer.includeData">Include data in spec</md-checkbox>
                    </div>
                </template>
            </mdDialog>
        </div>
        <div>
          <md-button class="md-icon-button" @click.native.prevent="openVoyager()">
            <md-tooltip> View Data in Voyager </md-tooltip>
            <md-icon>dynamic_form</md-icon>
          </md-button>
        </div>
        <div v-if="allowEdit">
          <md-button class="md-icon-button" @click.native.prevent="editChart">
            <md-tooltip> Edit Chart </md-tooltip>
            <md-icon>edit</md-icon>
          </md-button>
        </div>
      </div>
    </div>

<div class="md-layout md-gutter md-alignment-top-center">
    <div class="md-layout-item  md-size-35 md-small-size-100">
      <div class="loading-dialog_justify">
        <div class="visualize">
          <div class="viz-sample__header" v-if="vizOfTheDay">
            <md-icon style="font-size: 2rem !important; color: gray !important">bar_chart</md-icon> Viz of the day
          </div>
          <div class="viz-sample__header" v-if="!vizOfTheDay">
            Chart Information
          </div>
          <div class="viz-sample__content">
            <div class="">
              <div class="md-headline viz-u-mgup-sm btn--animated">{{chart.title}}</div>
              <div class="btn--animated">
                {{ slugify(chart.description) }}
              </div>
              <div class="viz-sample__list btn--animated">
                <ul>
                  <li class="viz-u-postion__rel" v-for="(tag, index) in chartTags" :key="index">
                    <div class="viz-sample__content__card viz-u-display__hide viz-u-postion__abs">
                      {{ tag.description }}
                      <div><a class="btn-text btn-text--simple" target="_blank" :href="tag.uri">More</a></div>
                    </div>
                    {{ tag.title }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    <div class="md-layout-item md-size-60 md-small-size-100">
      <div class="loading-dialog" style="margin: auto" v-if="loading">
        <spinner :loading="loading" />
      </div>
      <div class="loading-dialog" style="margin: auto" v-else>
        <div class="viz-u-display__desktop" style="margin-bottom: 2rem"/>
        <img src="https://www.seekpng.com/png/detail/238-2383560_clipart-stock-transparent-graph-cartoon-graph-icon-creative.png"
            style="height:50rem"/>
        <!-- <vega-lite :spec="spec" class="btn--animated"/> -->
        <a @click.prevent="navBack(true)" class="btn btn_small btn--primary utility-margin-big viz-u-display__ph" v-if="vizOfTheDay">View Gallery</a>
      </div>
      <data-voyager v-if="voyager.show" :data="spec.data"></data-voyager>
    </div>
  </div>
  </div>
</template>

<script>
import Vue from 'vue'
import VJsoneditor from 'v-jsoneditor'

import Dialog from '@/components/dialog.vue'
import { getDefaultChart, buildSparqlSpec } from '@/modules/vega-chart'

export default Vue.component('chartview', {
  data () {
    return {
      error: { status: false, message: null },
      filter: false,
      loading: true,
      spec: null,
      chart: {
        title: 'Test title',
        description: 'Here is a description of a chart which depicts some data that was recorded by researchers. The research corresponds to a paper which was published in a journal at a date. The data is stored in a database which can be accessed via a link.'
      },
      chartTags: [],
      args: null,
      authenticated: true,
      // authenticated: EventServices.authUser,
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
  components: {
    MdDialog: Dialog,
    VJsoneditor
  },
  computed: {
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
    //   EventServices
    //   .$on('isauthenticated', (data) => this.authenticated = data)
    //   .$on('allowChartEdit', (data) => this.allowEdit = data)
  }
})
</script>
