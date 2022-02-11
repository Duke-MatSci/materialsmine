<template>
  <div id="nanomine_app">
    <mdDrawer id="leftdrawer"></mdDrawer>
    <page-header id="header"></page-header>
    <router-view />
    <page-footer id="footer"></page-footer>
  </div>
</template>

<script>
import PageHeader from '@/components/nanomine/PageHeader.vue'
import PageFooter from '@/components/nanomine/PageFooter.vue'
import Drawer from '@/components/nanomine/Drawers.vue'

export default {
  name: 'NanomineBase',
  components: {
    PageHeader,
    PageFooter,
    MdDrawer: Drawer
  }
}
</script>
