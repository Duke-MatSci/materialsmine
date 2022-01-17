<template>
  <div class="home section_pages">
    <div>Temporary MetaMine Home</div>
  </div>
</template>

<script>

export default {
  name: 'Home',
  data: () => ({
    boolean: true
  }),
  created () {
    this.$store.commit('setAppHeaderInfo', {
      icon: '',
      pagetype: 'home',
      name: 'MetaMine',
      subtitle: 'An open source repository for mechanical metamaterials data'
    })
  }
}
</script>

<style lang="scss" scoped>
  .md-switch {
    display: flex;
  }
</style>
