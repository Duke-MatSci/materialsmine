<template>
  <md-app>
    <md-app-toolbar id="header" :toggler="toggleMenuVisibility" />

    <md-app-content class="viz-u-postion__rel" v-if="isAdmin">
      <div class="md-layout u_width--max md-gutter md-alignment-top-center">
        <div
          class="md-layout-item md-size-60 md-medium-size-90 md-xsmall-size-95"
        >
          <profile-header></profile-header>
          <div
            class="u_margin-top-small u_display-flex section_md-header md-layout-row md-theme-demo-light md-scrollbar"
          >
            <!-- permanent drawer -->
            <md-side-nav></md-side-nav>

            <div
              class="u_width--max md-content u--margin-pos utility-roverflow"
            >
              <div v-if="!!info.name">
                <h2
                  class="md-title u--color-black"
                  style="margin-bottom: 0.4rem"
                >
                  {{ info.name }}
                </h2>
              </div>
              <router-view />
            </div>
          </div>
        </div>
      </div>
    </md-app-content>
    <md-app-content
      class="u_margin-top-small u_display-flex section_md-header md-layout-row md-theme-demo-light md-scrollbar"
      v-else
    >
      <div class="md-size-20 u--margin-leftsm">
        <user-side-bar></user-side-bar>
      </div>
      <div class="md-content u--margin-pos utility-roverflow u_width--max">
        <div class="u_width--max">
          <profile-header></profile-header>
          <div class="u_margin-top-small u_width--max">
            <div class="md-content u_width--max">
              <div v-if="!!info.name">
                <h2
                  class="md-title u--color-black"
                  style="margin-bottom: 0.4rem"
                >
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
import ProfileHeader from '@/components/portal/ProfileHeader.vue'
import Drawer from '@/components/Drawer.vue'
import UserSideBar from '@/components/portal/UserSideBar.vue'
import { mapGetters } from 'vuex'
export default {
  name: 'PortalBase',
  components: {
    MdAppToolbar: PageHeader,
    MdDrawer: Drawer,
    MdSideNav: SideNav,
    ProfileHeader,
    UserSideBar
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
