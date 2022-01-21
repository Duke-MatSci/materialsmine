<template>
	<md-app md-waterfall md-mode="fixed-last">
		<md-app-toolbar :toggler='toggleMenu' />
		<md-app-drawer :md-active.sync="toggleMenuVisibility">
			<drawer />
		</md-app-drawer>
		<md-app-content>
      <ChartEdit/>
		</md-app-content>
	</md-app>
</template>
<script>
import ExpHeader from '@/components/explorer/Header.vue'
import Drawer from '@/components/explorer/Drawer.vue'
import ChartEdit from '@/components/explorer/ChartEdit.vue'
export default {
  name: 'ChartEditor',
  components: {
    mdAppToolbar: ExpHeader,
    Drawer,
    ChartEdit
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
