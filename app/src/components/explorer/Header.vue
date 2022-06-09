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
          <md-badge id="header-badge" class="md-primary" md-content="12">
            <md-button class="md-icon-button">
              <md-icon>person</md-icon>
            </md-button>
          </md-badge>
        </div>
      </div>
      <!-- Toolbar -->
      <div class="md-toolbar-row u_margin-top-med">
        <md-tabs class="md-primary" id="reset_tab_bg">
          <router-link  class="tabs" to="/explorer" v-slot="{navigate, href}" custom>
              <md-tab :href="href" @click="href === '/explorer' ? setSearching : navigate" id="tab-home" md-label="Search"> </md-tab>
          </router-link>
          <router-link class="tabs" to="/explorer/visualization" v-slot="{navigate, href}" custom>
              <md-tab :href="href" @click="navigate" id="tab-pages" md-label="Visualization"> </md-tab>
          </router-link>
          <router-link class="tabs" to="/explorer/curate" v-slot="{navigate, href}" custom>
              <md-tab :href="href" @click="navigate" id="tab-posts" md-label="Curate"> </md-tab>
          </router-link>
        </md-tabs>
      </div>
    </md-app-toolbar>
  </div>
</template>
<script>
export default {
  name: 'ExpHeader',
  props: ['toggler'],
  computed: {
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
