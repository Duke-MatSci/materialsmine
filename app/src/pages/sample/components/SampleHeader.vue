<template>
  <div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <div v-if="sample">
      <h1 class="sample_header">Sample: {{ this.$route.params.label }}</h1>
      <ul class="sample_labels">
        <li>DOI: {{ sample.DOI }}</li>
        <li>Label: {{ sample.sample_label }}</li>
      </ul>
    </div>
    <div v-if="sample === undefined">
      <h1 class="sample_header">Sample not found</h1>
    </div>
  </div>
</template>

<script>
import titleQuery from "../queries/titleQuery";
import getSampleHeader from "../services/getSampleHeader";

export default {
  methods: {
    fetchData() {
      this.error = null;
      this.loading = true;
      this.sample = null;
      getSampleHeader({
        query: titleQuery,
        route: this.$route.params.label,
      })
        .then((sample) => {
          this.sample = sample;
          this.loading = false;
        })
        .catch((error) => {
          console.error(error);
          this.error = "Sorry, something went wrong";
          this.loading = false;
        });
    },
  },
  created() {
    this.fetchData();
  },
  data() {
    return {
      loading: false,
      error: null,
      sample: null,
    };
  },
  watch: {
    $route: "fetchData",
  },
};
</script>
<style></style>
