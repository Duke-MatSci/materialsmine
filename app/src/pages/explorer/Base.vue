<template>
  <md-app md-waterfall md-mode="fixed">
    <md-app-toolbar :showTop="showTop" :toggler="toggleMenu" />
    <md-app-drawer :md-active.sync="toggleMenuVisibility">
      <drawers />
    </md-app-drawer>
    <md-app-content class="u--padding-zero u_height--max">
      <router-view />
    </md-app-content>
  </md-app>
</template>
<script>
import Drawers from '@/components/Drawer.vue'
import ExpHeader from '@/components/explorer/Header.vue'
export default {
  name: 'ExplorerBase',
  components: {
    mdAppToolbar: ExpHeader,
    Drawers
  },
  data () {
    return {
      toggleMenuVisibility: false,
      showTop: true
    }
  },
  computed: {
    getBody () {
      return document.querySelector('.md-app.md-fixed .md-app-scroller')
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.getBody.addEventListener('scroll', this.adjustHeader)
    })
  },
  beforeDestroy () {
    this.getBody.removeEventListener('scroll', this.adjustHeader)
  },
  methods: {
    toggleMenu () {
      this.toggleMenuVisibility = !this.toggleMenuVisibility
    },
    adjustHeader () {
      const scrollHeight = this.getBody.scrollTop
      if (window.innerWidth < 650) return
      this.showTop = !(scrollHeight > 100)
      const offset = scrollHeight > 100 ? '-74px' : '0px'
      this.getBody.style.position = 'relative'
      this.getBody.style.marginTop = offset
      this.getBody.style.paddingBottom = offset
    }
  }
}
</script>
