<template>
  <div>
    <div v-if="loadingProcessLabel" class="loading">Loading...</div>
    <div v-if="processLabel">
      <div class="md-display-1" style="color: #000">
        Curated Processing Steps and Parameters
      </div>
      <div class="md-subheading">Class: {{ processLabel }}</div>
    </div>
    <div v-if="loadingSteps">Loading...</div>
    <div v-if="steps && steps.length > 0">
      <div class="md-title">Processing Steps:</div>
      <ul>
        <li v-for="step in steps" :key="step.description">
          <span class="md-body-2">{{ step.parameterLabel }}</span>
          {{ step.description }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import classQuery from '@/modules/queries/classQuery'
import getClass from '@/modules/services/getClass'
import processingStepsQuery from '@/modules/queries/processingStepsQuery'
import getProcessingSteps from '@/modules/services/getProcessingSteps'

export default {
  methods: {
    fetchClass () {
      this.error = null
      this.loadingProcessLabel = true
      this.steps = null
      getClass({
        query: classQuery,
        route: this.$route.params.label
      })
        .then((processLabel) => {
          this.processLabel = processLabel
          this.loadingProcessLabel = false
        })
        .catch((error) => {
          console.error(error)
          this.error = 'Sorry, something went wrong'
          this.loadingProcessLabel = false
        })
    },
    fetchProcessingSteps () {
      this.error = null
      this.loadingSteps = true
      this.steps = null
      getProcessingSteps({
        query: processingStepsQuery,
        route: this.$route.params.label
      })
        .then((steps) => {
          this.steps = steps
          this.loadingSteps = false
        })
        .catch((error) => {
          console.error(error)
          this.error = 'Sorry, something went wrong'
          this.loadingSteps = false
        })
    }
  },
  data () {
    return {
      processLabel: null,
      loadingProcessLabel: false,
      loadingSteps: false,
      steps: null
    }
  },
  created () {
    this.fetchClass()
    this.fetchProcessingSteps()
  },
  watch: {
    $route: ['fetchClass', 'fetchProcessingSteps']
  }
}
</script>

<style scoped>
.md-display-1 {
  margin-top: 10px;
  color: #000;
}

.md-title {
  margin: 10px 0px 5px 0px;
}
li {
  list-style-type: none;
}
</style>
