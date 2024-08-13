<template>
  <div class="section_pages">
    <div v-if="!loading && !namespace" class="wrapper">
      <h1 class="visualize_header-h1 article_title">
        MaterialsMine Namespace Center
      </h1>
      <div class="article_subtitle">Welcome...</div>
    </div>
    <div v-else-if="!loading && namespace" class="wrapper">
      <h1 class="visualize_header-h1 article_title">{{ namespace }}</h1>
      <div class="article_subtitle">Additional information comming soon...</div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Namespace',
  data () {
    return {
      loading: false
    }
  },
  computed: {
    namespace () {
      return this.$route.params?.namespace
    }
  }
}
</script>
