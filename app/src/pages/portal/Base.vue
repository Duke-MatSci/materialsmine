<template>
  <md-app>
    <md-app-toolbar id="header" @toggler="toggleMenuVisibility"/>

    <md-app-content class="utility-roverflow viz-u-postion__rel">
      <div class="md-layout u_width--max md-gutter md-alignment-top-center">
        <div class="md-layout-item md-size-60 md-small-size-90 md-xsmall-size-95 ">
          <profile-header></profile-header>

          <div class="u_margin-top-small u_display-flex md-layout-row md-theme-demo-light md-scrollbar">
            <!-- permanent drawer -->
            <md-app-drawer class="md-right" :md-active.sync="sideBar" md-permanent="clipped">
              <md-side-nav></md-side-nav>
            </md-app-drawer>
            <div class="u_width--max md-content u--margin-pos utility-roverflow">
              <div v-if="!!info.name">
                <h2 class="md-title u--color-black" style="margin-bottom: .4rem;">
                  {{ info.name }}
                </h2>
              </div>
              <router-view />
            </div>
          </div>
        </div>
      </div>
    </md-app-content>
    <md-app-drawer :md-active.sync="menuVisible">
      <mdDrawer id="leftdrawer"></mdDrawer>
    </md-app-drawer>
  </md-app>
</template>

<script>
import PageHeader from '@/components/portal/Header.vue'
import SideNav from '@/components/portal/SideNav.vue'
import ProfileHeader from '../../components/portal/ProfileHeader.vue'
import Drawer from '@/components/Drawer.vue'
import { mapGetters } from 'vuex'
export default {
  name: 'PortalBase',
  components: {
    MdAppToolbar: PageHeader,
    MdDrawer: Drawer,
    MdSideNav: SideNav,
    ProfileHeader
  },
  data () {
    return {
      menuVisible: false,
      sideBar: false
    }
  },
  methods: {
    toggleMenuVisibility () {
      this.menuVisible = !this.menuVisible
    }
  },
  computed: {
    ...mapGetters({
      info: 'appHeaderInfo',
      isAdmin: 'auth/isAdmin',
      isAuth: 'auth/isAuthenticated'
    })
  }
}
</script>
