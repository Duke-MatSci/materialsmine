<template>
  <div>
    <md-app-toolbar class="md-large md-dense md-primary" id="reset_bg">
      <div class="md-toolbar-row">
        <div class="md-toolbar-section-start">
          <md-button class="md-icon-button" @click="toggleMenu">
            <md-icon>menu</md-icon>
          </md-button>

          <span class="md-title"><img id="logo" src="@/assets/img/materialsmine_logo_sm.png"/></span>
        </div>

        <div class="md-toolbar-section-end">
          <!-- <md-button class="md-icon-button">
            <md-icon>more_vert</md-icon>
          </md-button> -->
          <md-badge class="md-primary" md-content="12">
            <md-avatar>
              <img src="@/assets/img/brinson.jpeg" alt="Avatar">
            </md-avatar>
          </md-badge>
        </div>
      </div>
      <!-- Toolbar -->
      <div class="md-toolbar-row u_margin-top-med">
        <md-tabs class="md-primary" id="reset_tab_bg">
          <md-tab id="tab-home" md-label="Search"></md-tab>
          <md-tab id="tab-pages" md-label="Visualization"></md-tab>
          <md-tab id="tab-posts" md-label="Create"></md-tab>
        </md-tabs>
      </div>
    </md-app-toolbar>
  </div>
</template>
<script>
export default {
  name: 'ExpHeader',
  props: ['toggler'],
  methods: {
    toggleMenu(){
      this.toggler()
    }
  }
}
</script>