<template>
  <div>
    <div v-if="loadingProcessLabel" class="loading">Loading...</div>
    <div v-if="processLabel">
      <h1>Curated Processing Steps and Parameters</h1>
      <h3>Class: {{ processLabel }}</h3>
    </div>
    <div v-if="loadingSteps">Loading...</div>
    <div v-if="steps && steps.length > 0">
      <h3>Processing Steps:</h3>
      <ul>
        <li v-for="step in steps" :key="step.description">
          <span>{{ step.parameterLabel }}</span> |
          {{ step.description }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import classQuery from '../queries/classQuery'
import getClass from '../services/getClass'
import processingStepsQuery from '../queries/processingStepsQuery'
import getProcessingSteps from '../services/getProcessingSteps'

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

<style></style>
