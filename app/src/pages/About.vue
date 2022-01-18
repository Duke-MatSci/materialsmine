<template>
  <div class="about section_pages">
    <h1>This is an about page</h1>
  </div>
</template>

<script>
export default {
  name: 'About',
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'groups', name: 'Our Team' })
  }
}
</script>
