<template>
  <div>
    <md-app-toolbar class="md-large md-dense md-primary" id="reset_bg">
      <div class="md-toolbar-row">
        <div class="md-toolbar-section-start">
          <md-button class="md-icon-button" @click="toggler">
            <md-icon>menu</md-icon>
          </md-button>

          <span class="md-title"><img id="logo" src="@/assets/img/materialsmine_logo_sm.png"></span>
        </div>

        <div class="md-toolbar-section-end">
          <md-badge v-if="isAuth && showBadge" id="header-badge" class="md-primary" md-content="12">
            <md-button class="md-icon-button">
              Hi {{ displayName }}
            </md-button>
          </md-badge>
          <md-button v-if="isAuth"> Hi {{ displayName }}</md-button>
          <a v-if="!isAuth" class="md-icon-button large" href="/secure">
            Login
          </a>
        </div>
      </div>
      <!-- Toolbar -->
      <div class="md-toolbar-row u_margin-top-med">
        <md-tabs class="md-primary" id="reset_tab_bg" md-sync-route>
          <!-- Add _ to _menutabs as this is just a class selector for testing purposes only -->
          <md-tab class="_menutabs" to="/explorer" id="tab-home" md-label="Search" exact> </md-tab>
          <md-tab class="_menutabs" to="/explorer/visualization" id="tab-visualization" md-label="Visualization" exact> </md-tab>
          <md-tab class="_menutabs" to="/explorer/curate" id="tab-curate" md-label="Curate" exact> </md-tab>
          <md-tab class="_menutabs" to="/explorer/parameterized_query" id="tab-query" md-label="Parameterized Query" exact> </md-tab>
          <md-tab class="_menutabs" to="/explorer/sparql" id="tab-sparql" md-label="SPARQL Query" exact> </md-tab>
        </md-tabs>
      </div>
    </md-app-toolbar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'ExpHeader',
  props: ['toggler'],
  data () {
    return { showBadge: false }
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
    }
  }
}
</script>
