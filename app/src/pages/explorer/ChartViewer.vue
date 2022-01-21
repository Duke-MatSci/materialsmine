<template>
	<md-app md-waterfall md-mode="fixed-last">
		<md-app-toolbar :toggler='toggleMenu' />
		<md-app-drawer :md-active.sync="toggleMenuVisibility">
			<drawer />
		</md-app-drawer>
		<md-app-content>
      <ChartView/>
		</md-app-content>
	</md-app>
</template>
<script>
import ExpHeader from '@/components/explorer/Header.vue'
import Drawer from '@/components/explorer/Drawer.vue'
import ChartView from '@/components/explorer/ChartView.vue'
export default {
  name: 'ChartViewer',
  components: {
    mdAppToolbar: ExpHeader,
    Drawer,
    ChartView
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
