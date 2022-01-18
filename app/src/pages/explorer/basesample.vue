<template>
	<div class="page-container">
		<md-app md-waterfall md-mode="fixed-last">
			<md-app-toolbar :toggler='toggleMenu' />
			<md-app-drawer :md-active.sync="menuVisible">
				<drawer />
			</md-app-drawer>
			<md-app-content>
				<!-- **** Content Goes Here *** -->
			</md-app-content>
		</md-app>
	</div>
</template>


<script>
import ExpHeader from '@/components/explorer/Header.vue'
import Drawer from '@/components/explorer/Drawer.vue'
export default {
	name: 'Component Name',
	components: {
		mdAppToolbar: ExpHeader,
		Drawer
	},
	data () {
		return {
			menuVisible: false
		}
	},
	methods: {
		toggleMenu () {
		return this.menuVisible = !this.menuVisible
		}
  	},
}
</script>