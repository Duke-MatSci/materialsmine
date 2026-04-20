<template>
  <div :style="xFlow">
    <md-app-toolbar class="md-dense md-primary" id="reset_bg">
      <div class="md-toolbar-row viz-u-postion__rel">
        <div class="md-toolbar-section-start">
          <md-button class="md-icon-button" @click="toggler">
            <md-icon>menu</md-icon>
          </md-button>

          <router-link to="/" class="header-logo">
            <span class="md-title"
              ><img id="logo" src="@/assets/img/materialsmine_logo_sm.png"
            /></span>
          </router-link>
        </div>
        <div class="md-toolbar-section-end header_nav">
          <div class="nav nav_menu u--inline">
            <ul>
              <li>
                <router-link to="/nm" v-slot="{ navigate, href }" custom
                  ><a :href="href" @click="navigate">NanoMine</a></router-link
                >
              </li>
              <li>
                <router-link to="/mm" v-slot="{ navigate, href }" custom
                  ><a :href="href" @click="navigate">Metamine</a></router-link
                >
              </li>
            </ul>
          </div>
          <div class="u--inline nav_menu">
            <ul v-if="isAuth" class="nav_menu--container">
              <a
                class="u--default-size nav_menu--handler"
                style="color: #fff; font-size: 1.2rem !important"
              >
                Hi {{ displayName }}
              </a>
              <div class="nav_menu--siblings">
                <span
                  class="nav_menu--siblings-lists"
                  @click="$store.dispatch('auth/logout')"
                  ><a id="authmenu">Logout</a></span
                >
              </div>
            </ul>
            <div v-else>
              <a
                class="btn btn--tertiary btn--noradius"
                href="/secure"
                id="authmenu"
                >Login/Register</a
              >
            </div>
          </div>
        </div>
      </div>
    </md-app-toolbar>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'Header',
  props: ['toggler'],
  computed: {
    ...mapGetters({
      info: 'appHeaderInfo',
      isAuth: 'auth/isAuthenticated',
      displayName: 'auth/displayName'
    }),
    xFlow () {
      return { overflowX: 'clip' }
    }
  }
}
</script>
