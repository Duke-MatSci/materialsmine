<template>
    <md-app md-waterfall md-mode="fixed" id="metamine_app">
        <md-app-toolbar class="md-large md-dense md-primary adjust_metamine-toolbar">
            <div class="md-toolbar-row">
                <div class="md-toolbar-section-start">
                    <md-button class="md-icon-button" @click="toggleMenu">
                        <md-icon class="metamine_menu-icon">menu</md-icon>
                    </md-button>
                    <router-link to="/mm"><span class="md-title adjust_metamine-title">MetaMine</span></router-link>
                </div>

                <div class="md-toolbar-section-end">
                  <div>
                    <nav class="nav_menu nav_menu--lightbg">
                      <ul class="nav_ul">
                        <li>
                          <div class="nav_menu--container">
                            <a class="u--default-size nav_menu--handler" href="#">ABOUT</a>
                            <div class="nav_menu--siblings-mm">
                                <router-link to="/mm/teams" class="nav_menu--siblings-mm-lists"><a>About Us</a></router-link>
                                <router-link to="/nm/how" class="nav_menu--siblings-mm-lists"><a>How To</a></router-link>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div class="nav_menu--container">
                            <a class="u--default-size nav_menu--handler" href="#">VISUALIZE</a>
                            <div class="nav_menu--siblings-mm">
                                <router-link to="/explorer" class="nav_menu--siblings-mm-lists"><a>Browse Data</a></router-link>
                                <router-link to="/explorer/chart" class="nav_menu--siblings-mm-lists"><a>Explore Chart Gallery</a></router-link>
                                <router-link to="/mm/metamaterial_visualization" class="nav_menu--siblings-mm-lists"><a>Interactive Unit Cell Graph</a></router-link>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div class="nav_menu--container">
                            <a class="u--default-size nav_menu--handler" href="#">TOOLS</a>
                            <div class="nav_menu--siblings-mm">
                                <router-link to="/mm/pixelunit" class="nav_menu--siblings-mm-lists"><a>Geometry Explorer</a></router-link>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div class="nav_menu--container">
                            <a class="u--default-size nav_menu--handler" href="/nm/contact">CONTACT US</a>
                          </div>
                        </li>
                        <li>
                          <div class="nav_menu--container">
                            <a v-if="!isAuth" class="u--default-size nav_menu--handler" href="/secure">
                              <md-icon class="metamine_menu-icon">person</md-icon> LOGIN/REGISTER
                            </a>
                            <a v-else class="u--default-size nav_menu--handler" @click="$store.dispatch('logout')">
                              Hi {{ displayName }}
                            </a>
                          </div>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
            </div>
        </md-app-toolbar>
        <md-app-drawer :md-active.sync="toggleMenuVisibility">
            <drawers />
        </md-app-drawer>
        <md-app-content>
			<router-view />
		</md-app-content>
    </md-app>
</template>

<script>
import { mapGetters } from 'vuex'
import Drawers from '@/components/Drawer.vue'
export default {
  name: 'MetamineBase',
  components: {
    Drawers
  },
  computed: {
    ...mapGetters({
      isAuth: 'auth/isAuthenticated',
      displayName: 'auth/displayName',
    })
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
