<template>
  <div>
    <h1>Sample Images</h1>
    <div v-for="image in images" :key="image.src">
      <img :src="image.src" :alt="image.alt" />
    </div>
  </div>
</template>

<script>
import { querySparqlEndpoint } from '../queries/settings'
import imageQuery from '../queries/imagesQuery'
import getImages from '../services/getImages'

export default {
  props: {
    route: {
      type: String,
      default: 'no route'
    }
  },
  data () {
    return {
      images: []
    }
  },
  mounted () {
    const urlEncodedQuery = querySparqlEndpoint({
      query: imageQuery,
      route: this.route
    })
    getImages(urlEncodedQuery).then((images) => (this.images = images))
  }
}
</script>

<style></style>
