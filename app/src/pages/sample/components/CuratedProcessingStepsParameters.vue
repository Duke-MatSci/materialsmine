<template>
  <div>
    <h1>Curated Processing Steps and Parameters</h1>
    <h3>Class: {{ processLabel }}</h3>
    <h3>Processing Steps:</h3>
    <ul>
      <li v-for="step in steps" :key="step.description">
        <span>{{ step.parameterLabel }}</span> |
        {{ step.description }}
      </li>
    </ul>
  </div>
</template>

<script>
import classQuery from '../queries/classQuery'
import processingStepsQuery from '../queries/processingStepsQuery'
import getClass from '../services/getClass'
import getProcessingSteps from '../services/getProcessingSteps'
import { querySparqlEndpoint } from '../queries/settings'

export default {
  props: {
    name: 'CuratedProcessingStepsParameters',
    route: {
      type: String,
      default: 'no route'
    }
  },
  data () {
    return {
      processLabel: '',
      steps: []
    }
  },
  mounted () {
    // get class
    const urlEncodedClassQuery = querySparqlEndpoint({
      query: classQuery,
      route: this.route
    })
    getClass(urlEncodedClassQuery).then(
      (processLabel) => (this.processLabel = processLabel)
    )

    // get process steps
    const urlEncodedProcessStepsQuery = querySparqlEndpoint({
      query: processingStepsQuery,
      route: this.route
    })
    getProcessingSteps(urlEncodedProcessStepsQuery).then(
      (steps) => (this.steps = steps)
    )
  }
}
</script>

<style></style>
