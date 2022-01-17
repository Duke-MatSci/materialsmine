<template>
  <div class="home section_pages">
    <div>Temporary NanoMine Home</div>
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
      name: 'NanoMine',
      subtitle: 'An open source repository for nanocomposite data'
    })
  }
}
</script>

<style lang="scss" scoped>
  .md-switch {
    display: flex;
  }
</style>
