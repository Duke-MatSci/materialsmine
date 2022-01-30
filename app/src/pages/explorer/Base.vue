<template>
	<md-app md-waterfall md-mode="fixed-last">
		<md-app-toolbar :toggler='toggleMenu' />
		<md-app-drawer :md-active.sync="toggleMenuVisibility">
			<drawers />
		</md-app-drawer>
		<md-app-content>
			<router-view />
		</md-app-content>
	</md-app>
</template>
<script>
import ExpHeader from '@/components/explorer/Header.vue'
import Drawers from '@/components/Drawer.vue'
export default {
  name: 'ExplorerBase',
  components: {
    mdAppToolbar: ExpHeader,
    Drawers
  },
  data () {
    return {
      toggleMenuVisibility: false
    }
  },
  methods: {
    toggleMenu () {
      this.toggleMenuVisibility = !this.toggleMenuVisibility
    }
  }
}
</script>
