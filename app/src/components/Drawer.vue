<template>
  <div class="md-app-internal-drawer u--layout-flex u--layout-flex-column u--layout-flex-justify-sb">
    <md-list md-expand-single=true class="utility-transparentbg">
      <md-toolbar class="md-transparent u--font-emph-l u_toggle-display-off" md-elevation="0"><small>App Navigation</small></md-toolbar>
      <div class="visualize-pagination-width-mod footer_content-mobile u_margin-none">
        <md-toolbar class="md-transparent u--font-emph-l" md-elevation="0"><small>Welcome {{ name }}</small></md-toolbar>
      </div>
      <md-divider></md-divider>

      <md-list-item md-expand>
        <md-icon class="utility-navfonticon">home</md-icon>
        <span class="md-list-item-text utility-navfont">Home</span>
        <md-list slot="md-expand">
          <router-link to="/explorer" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate" class="md-inset"> Explorer </md-list-item>
          </router-link>
          <router-link to="/mm" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate" class="md-inset"> Metamine </md-list-item>
          </router-link>
          <router-link to="/nm" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Nanomine</md-list-item>
          </router-link>
        </md-list>
      </md-list-item>
      <md-list-item md-expand>
        <md-icon class="utility-navfonticon">groups</md-icon>
        <span class="md-list-item-text utility-navfont">About</span>
        <md-list slot="md-expand">
          <router-link :to="'/nm/about'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate" class="md-inset"> About Us </md-list-item>
          </router-link>
          <router-link :to="'/nm/how'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">How To</md-list-item>
          </router-link>
          <router-link :to="'/nm/news'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Research + News</md-list-item>
          </router-link>
        </md-list>
      </md-list-item>

      <md-toolbar class="md-transparent u--font-emph-l u_margin-top-small" md-elevation="0"><small>Explore</small></md-toolbar>
      <md-divider></md-divider>

      <md-list-item md-expand>
        <md-icon class="utility-navfonticon">view_comfy</md-icon>
        <span class="md-list-item-text utility-navfont">Visualize</span>
        <md-list slot="md-expand">
          <router-link to="/explorer" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate" class="md-inset">Browse Data</md-list-item>
          </router-link>
          <router-link to="/explorer/chart" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate" class="md-inset">Chart Gallery</md-list-item>
          </router-link>
          <router-link to="/explorer/images" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate" class="md-inset">Image Gallery</md-list-item>
          </router-link>
          <router-link to="/explorer/xmls" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate" class="md-inset">View Xmls</md-list-item>
          </router-link>
        </md-list>
      </md-list-item>
      <md-list-item md-expand>
        <md-icon class="utility-navfonticon">handyman</md-icon>
        <span class="md-list-item-text utility-navfont">Tools</span>
        <md-list slot="md-expand">
          <router-link :to="'/explorer/tools'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Module & Simulation Tools</md-list-item>
          </router-link>
          <router-link :to="'/nm/tools/plot-curation'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Easy CSV Plotter</md-list-item>
          </router-link>
          <router-link :to="'/explorer/sparql'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Sparql Query Interface</md-list-item>
          </router-link>
        </md-list>
      </md-list-item>

      <md-toolbar class="md-transparent u--font-emph-l u_margin-top-small" md-elevation="0" v-if="isAuth" ><small>User Dashboard</small></md-toolbar>
      <md-divider v-if="isAuth" ></md-divider>
      <md-list-item md-expand v-if="isAuth">
        <md-icon class="utility-navfonticon">upload</md-icon>
        <span class="md-list-item-text utility-navfont">Curate</span>
        <md-list slot="md-expand">
          <router-link :to="'/explorer/curate/spreadsheet'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Upload a Spreadsheet</md-list-item>
          </router-link>
          <router-link :to="'/explorer/curate/stepper'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Fill a Form</md-list-item>
          </router-link>
          <router-link :to="'/explorer/curate/sdd'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Submit SDD</md-list-item>
          </router-link>
          <router-link :to="'/explorer/chart/editor/new'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Create New Chart</md-list-item>
          </router-link>
          <router-link :to="'/explorer/curate/validlist'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Add Xlsx List Entry</md-list-item>
          </router-link>
        </md-list>
      </md-list-item>
      <md-toolbar class="md-transparent u--font-emph-l u_margin-top-small" md-elevation="0" v-if="isAuth && isAdmin" ><small>Admin</small></md-toolbar>
      <md-divider v-if="isAuth && isAdmin" ></md-divider>

      <router-link v-if="isAuth && isAdmin" :to="'/portal'" v-slot="{navigate, href}" custom>
        <md-list-item @click="navigate" :href="href">
          <md-icon class="utility-navfonticon">admin_panel_settings</md-icon>
          <span class="md-list-item-text utility-navfont">Admin Center</span>
        </md-list-item>
      </router-link>
    </md-list>

    <md-list class="utility-transparentbg">
      <md-list-item v-if="isAuth" @click="$store.dispatch('auth/logout')">
        <md-icon class="utility-navfonticon">logout</md-icon>
        <span class="md-list-item-text utility-navfont">Log out</span>
      </md-list-item>
      <md-list-item v-if="!isAuth" @click="login">
        <md-icon class="utility-navfonticon">login</md-icon>
        <span class="md-list-item-text utility-navfont">Login</span>
      </md-list-item>
    </md-list>

  </div>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'Drawers',
  computed: {
    ...mapGetters({
      isAuth: 'auth/isAuthenticated',
      isAdmin: 'auth/isAdmin',
      name: 'auth/displayName'
    })
  },
  methods: {
    login () {
      window.location.href = '/secure'
    }
  }
}
</script>
