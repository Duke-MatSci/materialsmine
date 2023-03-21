<template>
  <div>
    <md-toolbar class="md-transparent" md-elevation="0">Welcome {{ name }}</md-toolbar>
    <md-list md-expand-single=true class="utility-transparentbg">
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
        </md-list>
      </md-list-item>
      <md-list-item md-expand v-if="isAuth">
        <md-icon class="utility-navfonticon">upload</md-icon>
        <span class="md-list-item-text utility-navfont">Curate</span>
        <md-list slot="md-expand">
          <!-- <md-list-item class="md-inset" href="https://materialsmine.org/nm#/XMLCONV">
            Upload a Spreadsheet
          </md-list-item> -->
          <router-link :to="'/explorer/curate/spreadsheet'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Upload a Spreadsheet</md-list-item>
          </router-link>
          <router-link :to="''" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Fill a Form</md-list-item>
          </router-link>
          <router-link :to="''" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Submit SDD</md-list-item>
          </router-link>
          <router-link :to="''" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Create New Chart</md-list-item>
          </router-link>
          <router-link :to="'/explorer/curate/validlist'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Add Xlsx List Entry</md-list-item>
          </router-link>
        </md-list>
      </md-list-item>
      <md-list-item md-expand>
        <md-icon class="utility-navfonticon">handyman</md-icon>
        <span class="md-list-item-text utility-navfont">Tools</span>
        <md-list slot="md-expand">
          <router-link :to="'/nm/tools/module_homepage'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Module Tools</md-list-item>
          </router-link>
          <router-link :to="'/nm/tools/simtools'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Simulation Tools</md-list-item>
          </router-link>
          <router-link :to="'/nm/tools/chemprops'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">ChemProps</md-list-item>
          </router-link>
          <router-link :to="'/nm/tools/plot-curation'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Easy CSV Plotter</md-list-item>
          </router-link>
          <router-link :to="'/explorer/sparql'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Sparql Query Tool</md-list-item>
          </router-link>
        </md-list>
      </md-list-item>
      <md-list-item v-if="isAuth && isAdmin" md-expand>
        <md-icon class="utility-navfonticon">edit</md-icon>
        <span class="md-list-item-text utility-navfont">Admin</span>
        <md-list slot="md-expand">
          <router-link :to="'/nm/contact-inquiry'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Contact Inquiry</md-list-item>
          </router-link>
          <router-link :to="'/deploy'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Deploy</md-list-item>
          </router-link>
          <router-link :to="'/nm'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">User Management</md-list-item>
          </router-link>
          <router-link :to="'/nm'" v-slot="{navigate, href}" custom>
            <md-list-item :href="href" @click="navigate"  class="md-inset">Curations</md-list-item>
          </router-link>
        </md-list>
      </md-list-item>
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
