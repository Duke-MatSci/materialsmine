<template>
  <div class="sparql-template-page">
    <div v-if="loadingTemplates">
      <md-progress-spinner md-mode="indeterminate" />
    </div>
    <div v-else-if="totalTemplateCount === 0">
      <p>No templates were loaded</p>
    </div>
    <div v-else>
      <h1 class="visualize_header-h1 u_margin-top-med">{{ pageTitle }}</h1>
      <md-toolbar>
        <h3 class="md-title">Query Template</h3>
      </md-toolbar>
      <div class="display">
        <md-button
          class="template-back"
          @click="shiftTemplate(-1)"
        >
          <md-icon>chevron_left</md-icon>
        </md-button>
        <md-button
          class="template-next"
          @click="shiftTemplate(1)"
        >
          <md-icon>chevron_right</md-icon>
        </md-button>
        <p class="display-text">
          <span
            v-for="(segment, index) in selectedTemplate.displaySegments"
            :key="index"
          >
            <span
              v-if="segment.type == TextSegmentType.TEXT"
              v-html="segment.text"
            ></span>
            <span v-else>
              <select
                v-model="varSelections[segment.varName]"
                :id="segment.varName"
                :name="segment.varName"
              >
                <option
                  v-for="(value, name) in selectedTemplate.options[segment.varName]"
                  :key="name"
                  :value="name"
                >
                  {{name}}
                </option>
              </select>
            </span>
          </span>
        </p>
      </div>
      <div class="display-count-indicator">
        <p>Query template {{currentIndex + 1}} of {{totalTemplateCount}}</p>
      </div>
      <div
        class="query"
        v-if="query"
      >
        <accordion
          :startOpen="false"
          title="SPARQL Query"
        >
          <yasqe
            :value="query"
            :readOnly="true"
          ></yasqe>
        </accordion>
      </div>
      <div class="results">
        <accordion
          :startOpen="true"
          title="SPARQL Results"
        >
          <div class="results-controls">
            <button
              class="btn btn--primary"
              :disabled="autoRefresh || !newQuery"
              @click="execQuery"
            >
              Search Query
            </button>
            <md-switch
              class="md-primary"
              v-model="autoRefresh"
            >
              Auto Refresh
            </md-switch>
            <div class="button-row">
              <div>
                <router-link :to="{ name: 'NewChartDataVoyager' }" target="_blank">
                  <button
                    class="btn btn--primary"
                    @click="selectQueryForVizEditor()"
                  >
                    Open in Datavoyager
                  </button>
                </router-link>
              </div>
            </div>
          </div>
          <div
            class="results-progress"
            v-show="runningQuery"
          >
            <md-progress-spinner
              :md-diameter="100"
              :md-stroke="6"
              md-mode="indeterminate"
            />
          </div>
          <div v-show="!runningQuery">
            <yasr v-if="results" :results="results"/>
            <p v-else class="no-results-message">
              No results yet. Press "Refresh Results" to run the query and see results.
            </p>
          </div>
        </accordion>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
import { querySparql } from '@/modules/sparql'
// import { goToView, VIEW_URIS, DEFAULT_VIEWS } from "../../../utilities/views";
import {
  loadSparqlTemplates,
  TextSegmentType,
  OptValueType
} from './sparql-templates'
import debounce from '@/modules/debounce'
import accordion from '@/components/accordion.vue'
import yasr from '@/components/explorer/yasr'
import yasqe from '@/components/explorer/yasqe'

export default {
  components: {
    accordion,
    yasqe,
    yasr
  },
  data () {
    return {
      loadingTemplates: true,
      runningQuery: false,
      queryTemplates: {},
      TextSegmentType,
      selTemplateId: null,
      query: '',
      varSelections: {},
      results: null,
      autoRefresh: false,
      lastRunQuery: '',
      execQueryDebounced: debounce(this.autoExecQuery, 300)
    }
  },
  computed: {
    templateIds () {
      return Object.keys(this.queryTemplates)
    },
    selectedTemplate () {
      return this.queryTemplates[this.selTemplateId]
    },
    currentIndex () {
      return this.templateIds.indexOf(this.selTemplateId)
    },
    totalTemplateCount () {
      return this.templateIds.length
    },
    newQuery () {
      return this.query !== this.lastRunQuery
    },
    pageTitle () {
      const selectionsKeys = Object.keys(this.varSelections)
      const title = this.varSelections[selectionsKeys[3]]
      return title[0].toUpperCase() + title.substring(1)
    }
  },
  methods: {
    ...mapMutations('vega', ['setQuery']),
    selectQueryForVizEditor () {
      this.setQuery(this.query)
    },
    async loadSparqlTemplates () {
      this.loadingTemplates = true
      try {
        const templates = await loadSparqlTemplates()
        this.queryTemplates = {}
        templates.forEach((t) => {
          this.queryTemplates[t.id] = t
        })
        this.selTemplateId = templates.length > 0 ? templates[0].id : null
      } finally {
        this.loadingTemplates = false
      }
    },
    shiftTemplate (amount) {
      let newIndex = this.currentIndex + amount
      while (newIndex >= this.totalTemplateCount) {
        newIndex -= this.totalTemplateCount
      }
      while (newIndex < 0) {
        newIndex += this.totalTemplateCount
      }
      this.selTemplateId = this.templateIds[newIndex]
    },
    populateSelections () {
      if (!this.selectedTemplate) {
        return
      }
      this.varSelections = Object.fromEntries(
        Object.entries(this.selectedTemplate.options).map(
          ([varName, varOpts]) => [varName, Object.keys(varOpts)[0]]
        )
      )
    },
    getOptVal (varName, optName) {
      return this.selectedTemplate.options[varName][optName]
    },
    buildQuery () {
      if (!this.selectedTemplate) {
        return
      }
      var tempQuery = this.selectedTemplate.SPARQL

      // append VALUES clause to query if there are any active selections
      const activeSelections = Object.fromEntries(
        Object.entries(this.varSelections).filter(
          (selEntry) => this.getOptVal(...selEntry).type !== OptValueType.ANY
        )
      )
      if (Object.keys(activeSelections).length > 0) {
        const varNames = Object.keys(activeSelections)
          .map((varName) => `?${varName}`)
          .join(' ')

        const optVals = Object.entries(activeSelections)
          .map((selEntry) => {
            const optVal = this.getOptVal(...selEntry)
            let value
            if (optVal.type === OptValueType.LITERAL) {
              value = optVal.value
              if (typeof value !== 'number') {
                value = `"${value}"`
              }
            } else if (optVal.type === OptValueType.IDENTIFIER) {
              value = `<${optVal.value}>`
            } else {
              throw new Error(`Unknown option value type: ${optVal.type}`)
            }
            return value
          })
          .join(' ')
        const valuesBlock = `\n  VALUES (${varNames}) {\n    (${optVals})\n  }\n`

        tempQuery = tempQuery.replace(/(where\s*{)/i, '$1' + valuesBlock)
      }

      // find any replaceable variable names
      const activeReplacements = Object.fromEntries(
        Object.entries(this.selectedTemplate.replacements).map(
          ([varName, varObj]) => {
            // find the actively selected option
            return [varName, varObj.varFormat.replace('${' + 'var}', this.varSelections[varObj.subVar])]
          }
        )
      )
      if (Object.keys(activeReplacements).length > 0) { // replacements are active
        Object.keys(activeReplacements).map((varName) => {
          // convert to variable names and replace in query
          const replacement = `?${this.camelize(activeReplacements[varName])}`
          var originalRE = new RegExp('\\?' + varName)
          tempQuery = tempQuery.replace(originalRE, replacement)
        })
      }
      this.query = tempQuery
    },
    camelize (str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ''
        return match.toUpperCase()
      })
    },
    async execQuery () {
      this.results = null
      this.lastRunQuery = this.query
      this.runningQuery = true
      this.results = await querySparql(this.query)
      this.runningQuery = false
    },
    autoExecQuery () {
      if (this.autoRefresh && this.newQuery) {
        this.execQuery()
      }
    }
  },
  created () {
    this.loadSparqlTemplates()
  },
  watch: {
    // The following reactive watchers are used due to limitations of not being
    // able to deep watch dependencies of computed methods.
    selectedTemplate: {
      handler: 'populateSelections'
    },
    varSelections: {
      handler: 'buildQuery',
      deep: true
    },
    query: {
      handler: 'execQueryDebounced'
    },
    autoRefresh: {
      handler: 'execQueryDebounced'
    }
  }
}
</script>

<style lang="scss" scoped>
.sparql-template-page {
  max-width: 960px;
  margin: auto;
}
.button-row {
  margin: 10px 0;
  display: flex;
  justify-content: flex-end;
}
.display {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 18em;
  .template-next {
    order: 1;
  }
  .display-text {
    max-height: calc(100% - 60px);
    overflow: auto;
    margin: 30px;
    font-size: 16px;
    line-height: 40px;
  }
}
.display-count-indicator {
  text-align: center;
  margin-bottom: 20px;
  font-weight: 500;
}
.accordion {
  margin-bottom: 20px;
}
.results-controls {
  margin: 20px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  > * {
    margin-right: 50px;
  }
}
.results-progress {
  display: flex;
  justify-content: center;
}
.no-results-message {
  text-align: center;
  margin-top: 20px;
}
</style>
