<template>
  <div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div v-if="sample">
      <div class="md-display-2" style="color: #000">
        {{ this.$route.params.label }}
      </div>
      <div data-test="sample_label">
        <span class="md-body-2">Label:</span> {{ sample.sample_label }}
      </div>
      <div data-test="DOI">
        <span class="md-body-2">DOI:</span> {{ sample.DOI }}
      </div>
    </div>
    <div v-if="sample === null">
      <h1 class="sample_header">Sample not found</h1>
    </div>
  </div>
</template>

<script>
import titleQuery from '@/modules/queries/titleQuery'
import getSampleHeader from '@/modules/services/getSampleHeader'

export default {
  methods: {
    fetchData () {
      this.error = null
      this.loading = true
      this.sample = null
      getSampleHeader({
        query: titleQuery,
        route: this.$route.params.label
      })
        .then((sample) => {
          this.sample = sample
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
      sample: null
    }
  },
  watch: {
    $route: 'fetchData'
  }
}
</script>
<style>
.md-display-2 {
  margin: 20px 0px;
  font-weight: 500;
}
</style>
