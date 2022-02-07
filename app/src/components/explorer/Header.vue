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
          <div class="u_margin-top-small u_width--small u_margin-right-small" v-if="searchEnabled">
            <input type="text" class="form__input form__input--flat" placeholder="Searching..." name="search" id="search" v-model="searchTerm"  />
            <label htmlFor="search" class="form__label form__input--flat-label">Searching...</label>
          </div>
          <md-badge id="header-badge" class="md-primary" md-content="12">
            <md-avatar>
              <img src="@/assets/img/brinson.jpeg" alt="Avatar">
            </md-avatar>
          </md-badge>
        </div>
      </div>
      <!-- Toolbar -->
      <div class="md-toolbar-row u_margin-top-med">
        <md-tabs class="md-primary" id="reset_tab_bg">
          <md-tab class="tabs" id="tab-home" md-label="Search"></md-tab>
          <md-tab class="tabs" id="tab-pages" md-label="Visualization"></md-tab>
          <md-tab class="tabs" id="tab-posts" md-label="Create"></md-tab>
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
