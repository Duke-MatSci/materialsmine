<template>
    <md-app md-waterfall md-mode="fixed" id="metamine_app">
        <md-app-toolbar class="md-large md-dense md-primary adjust_metamine-toolbar">
            <div class="md-toolbar-row">
                <div class="md-toolbar-section-start">
                    <md-button class="md-icon-button" @click="toggleMenu">
                        <md-icon class="metamine_menu-icon">menu</md-icon>
                    </md-button>
                    <span class="md-title adjust_metamine-title">Metamine</span>
                </div>

                <div class="md-toolbar-section-end">
                    <md-button><span class="metamine_menu">ABOUT</span></md-button>
                    <md-button href="/explorer"><span class="metamine_menu">VISUALIZE</span></md-button>
                    <md-button><span class="metamine_menu">TOOLS</span></md-button>
                    <md-button><span class="metamine_menu">CONTACT</span></md-button>
                    <md-button>
                        <span class="metamine_menu">LOGIN/REGISTER</span>
                    </md-button>
                </div>
            </div>
        </md-app-toolbar>
        <md-app-drawer :md-active.sync="toggleMenuVisibility">
            <drawer />
        </md-app-drawer>
        <md-app-content>
			<router-view />
		</md-app-content>
    </md-app>
</template>

<script>
import Drawer from '@/components/Drawer.vue'
export default {
  name: 'MetamineBase',
  components: {
    Drawer
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
