<template>
  <div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="curatedProperties && curatedProperties.length > 0">
      <h2 class="md-display-1" style="color: #000">
        Curated Properties of Nanocomposite Sample
      </h2>
      <h3 class="md-title">Scalar attributes:</h3>
      <ul>
        <li
          v-for="property in curatedProperties"
          :key="property.type + property.value"
          class="md-body-1"
        >
          <span class="md-body-2">{{ property.type }}: </span>
          <span>{{ property.value }}</span>
          <span> {{ property.units }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import curatedPropertiesQuery from '@/modules/queries/curatedPropertiesQuery'
import getCuratedProperties from '@/modules/services/getCuratedProperties'

export default {
  methods: {
    fetchData () {
      this.error = null
      this.loading = true
      this.curatedProperties = null
      getCuratedProperties({
        query: curatedPropertiesQuery,
        route: this.$route.params.label
      })
        .then((curatedProperties) => {
          this.curatedProperties = curatedProperties
          this.loading = false
        })
        .catch((error) => {
          console.error(error)
          this.error = 'Sorry, something went wrong'
          this.loading = false
        })
    }
  },
  data () {
    return {
      loading: false,
      error: null,
      curatedProperties: null
    }
  },
  created () {
    this.fetchData()
  },
  watch: {
    $route: 'fetchData'
  }
}
</script>

<style scoped>
.md-display-1 {
  margin: 10px 0px;
  color: #000;
}
li {
  list-style-type: none;
}

.md-title {
  margin-bottom: 5px;
}
</style>
