<template>
  <div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error"></div>
    <div v-if="links && links.length > 0">
      <h2>Other Samples from this Research Article</h2>
      <router-link
        :to="`/explorer/sample/${link}`"
        v-for="link in links"
        :key="link"
      >
        {{ link }}
      </router-link>
    </div>
  </div>
</template>

<script>
import otherSamplesQuery from '../queries/otherSamplesQuery'
import getOtherSamples from '../services/getOtherSamples'

export default {
  methods: {
    fetchData () {
      this.error = null
      this.loading = true
      this.links = null
      getOtherSamples({
        query: otherSamplesQuery,
        route: this.$route.params.label
      })
        .then((links) => {
          this.links = links
          this.loading = false
        })
        .catch((error) => {
          console.error(error)
          this.error = 'Sorry, something went wrong'
          this.loading = false
        })
    }
  },
  created () {
    this.fetchData()
  },
  data () {
    return {
      loading: false,
      error: null,
      links: []
    }
  },
  watch: {
    $route: 'fetchData'
  }
}
</script>
<style></style>
