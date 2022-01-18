<template>
  <div id="app" class="page-container">
    <mdDrawer id="leftdrawer"></mdDrawer>
    <page-header id="header" :info="info"></page-header>
    <!-- <div>
      Page Content Here
    </div> -->
    <page-footer id="footer"></page-footer>
  </div>
</template>

<script>
import PageHeader from '@/components/nanomine/PageHeader.vue'
import PageFooter from '@/components/nanomine/PageFooter.vue'
import Drawer from '@/components/drawer.vue'

export default {
  name: 'HomeNM',
  data: () => ({
    boolean: true
  }),
  components: {
    PageHeader,
    PageFooter,
    MdDrawer: Drawer
  },
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
