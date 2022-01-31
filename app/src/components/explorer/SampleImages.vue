<template>
  <div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error"></div>
    <div v-if="images && images.length > 0">
      <h1>Sample Images</h1>
      <div data-test="sample_image" v-for="image in images" :key="image.src">
        <img :src="image.src" :alt="image.alt" />
      </div>
    </div>
  </div>
</template>

<script>
import imagesQuery from '@/modules/queries/imagesQuery'
import getSampleImages from '@/modules/services/getSampleImages'

export default {
  methods: {
    fetchData () {
      this.error = null
      this.loading = true
      this.images = null
      getSampleImages({
        query: imagesQuery,
        route: this.$route.params.label
      })
        .then((images) => {
          this.images = images
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
      images: null,
      loading: false,
      error: null
    }
  },
  watch: {
    $route: 'fetchData'
  }
}
</script>
<style></style>
