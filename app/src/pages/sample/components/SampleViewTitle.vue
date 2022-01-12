<template>
  <div>
    <h1 class="sample_header">Sample: {{ route }}</h1>
    <li class="sample_labels">
      <ul>DOI: {{ title.DOI }}</ul>
      <ul>Label: {{ title.sample_label }}</ul>
    </li>
  </div>
</template>

<script>
import { querySparqlEndpoint } from '../queries/settings'
import titleQuery from '../queries/titleQuery'
import getTitle from '../services/getTitle'

export default {
  props: {
    route: {
      type: String,
      default: 'No route'
    }
  },
  data () {
    return {
      title: {}
    }
  },
  mounted () {
    const urlEncodedQuery = querySparqlEndpoint({
      query: titleQuery,
      route: this.route
    })
    getTitle(urlEncodedQuery).then((title) => (this.title = title))
  }
}
</script>

<style>
.sample_header {
  padding: 20px 0px;
  color: #000;
  font-size: 2rem;
}

li, ul {
  list-style: none;
}
</style>
