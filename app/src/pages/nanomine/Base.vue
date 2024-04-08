<template>
  <md-app md-waterfall md-mode="fixed">
    <md-app-toolbar id="header" :toggler="toggleMenuVisibility" />
    <md-app-content
      class="u--padding-zero u--layout-flex u--layout-flex-column"
    >
      <HeroHeader />
      <router-view />
      <page-footer id="footer"></page-footer>
    </md-app-content>
    <md-app-drawer :md-active.sync="menuVisible">
      <mdDrawer id="leftdrawer"></mdDrawer>
    </md-app-drawer>
  </md-app>
</template>

<script>
import PageHeader from '@/components/nanomine/PageHeader.vue'
import HeroHeader from '@/components/nanomine/HeroHeader.vue'
import PageFooter from '@/components/nanomine/PageFooter.vue'
import Drawer from '@/components/Drawer.vue'

export default {
  name: 'NanomineBase',
  components: {
    MdAppToolbar: PageHeader,
    HeroHeader,
    PageFooter,
    MdDrawer: Drawer
  },
  data () {
    return {
      menuVisible: false
    }
  },
  methods: {
    toggleMenuVisibility () {
      this.menuVisible = !this.menuVisible
    }
  }
}
</script>
