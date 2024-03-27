<template>
  <div class="viz-u-postion__rel">
    <md-app-toolbar
      class="md-large md-dense md-primary"
      id="reset_bg"
      :style="[transition, !showTop && hideHeaderView]"
    >
      <div class="md-toolbar-row">
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

        <div class="md-toolbar-section-end md-toolbar-section-end_adjust">
          <div class="nav nav_menu u--inline">
            <ul>
              <li>
                <router-link to="/nm" v-slot="{ navigate, href }" custom>
                  <a :href="href" @click="navigate">NanoMine</a></router-link
                >
              </li>
              <li>
                <router-link to="/mm" v-slot="{ navigate, href }" custom>
                  <a :href="href" @click="navigate">Metamine</a>
                </router-link>
              </li>
              <li>
                <span v-if="isAuth" class="u_color_white u--font-emph-m">
                  Hi {{ displayName }}</span
                >
                <a
                  v-if="!isAuth"
                  class="md-icon-button large u_color_white u--font-emph-m u_margin-top-small"
                  href="/secure"
                >
                  Login
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <!-- Toolbar -->
      <div class="md-toolbar-row u_margin-top-med u_toggle-display-off">
        <md-tabs class="md-primary" id="reset_tab_bg" md-sync-route>
          <!-- Add _ to _menutabs as this is just a class selector for testing purposes only -->
          <md-tab
            class="_menutabs"
            to="/explorer"
            id="tab-home"
            md-label="Search"
            exact
          >
          </md-tab>
          <md-tab
            class="_menutabs"
            to="/explorer/visualization"
            id="tab-visualization"
            md-label="Visualization"
          >
          </md-tab>
          <md-tab
            class="_menutabs"
            to="/explorer/curate"
            id="tab-curate"
            md-label="Curate"
          >
          </md-tab>
          <md-tab
            class="_menutabs"
            to="/explorer/tools"
            id="tab-tools"
            md-label="Tools"
          >
          </md-tab>
          <md-tab
            class="_menutabs"
            to="/explorer/parameterized_query"
            id="tab-query"
            md-label="Parameterized Query"
            exact
          >
          </md-tab>
          <md-tab
            class="_menutabs"
            to="/explorer/sparql"
            id="tab-sparql"
            md-label="SPARQL Query"
            exact
          >
          </md-tab>
        </md-tabs>
      </div>
    </md-app-toolbar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'ExpHeader',
  props: ['toggler', 'showTop'],
  data () {
    return {
      showBadge: false,
      scrollPosition: 0
    }
  },
  computed: {
    ...mapGetters({
      isAuth: 'auth/isAuthenticated',
      displayName: 'auth/displayName'
    }),
    searchTerm: {
      get () {
        return this.$store.getters['explorer/getSearchKeyword']
      },
      set (payload) {
        this.$store.commit('explorer/setSearchKeyword', payload)
        if (!payload) {
          this.$store.commit('explorer/setSearching')
        }
      }
    },
    searchEnabled () {
      return this.$store.getters['explorer/getSearching']
    },
    hideHeaderView () {
      return { top: `-${74}px` }
    },
    transition () {
      return { transition: `all ${0.2}s linear` }
    }
  }
}
</script>
