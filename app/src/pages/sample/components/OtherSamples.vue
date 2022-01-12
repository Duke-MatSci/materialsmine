<template>
  <div>
    <h2>Other Samples from this Research Article</h2>
    <router-link :to="`/sample/${link}`" v-for="link in links" :key="link">
      {{ link }}
    </router-link>
  </div>
</template>

<script>
import { querySparqlEndpoint } from "../queries/settings";
import otherSamplesQuery from "../queries/otherSamplesQuery";
import getOtherSamples from "../services/getOtherSamples";
export default {
  props: {
    route: {
      type: String,
      default: "no route",
    },
  },
  data() {
    return {
      links: [],
    };
  },
  mounted() {
    const urlEncodedQuery = querySparqlEndpoint({
      query: otherSamplesQuery,
      route: this.route,
    });
    getOtherSamples(urlEncodedQuery).then((links) => (this.links = links));
  },
};
</script>

<style></style>
