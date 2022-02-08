<template>
<div class="page-container md-layout-column">
    <div class="nav_mobile-icon" @click="showSidebar = true">
        <div class="nav_mobile-icon-menu"></div>
    </div>
    <md-drawer :md-active.sync="showSidebar">
        <md-toolbar class="md-transparent" md-elevation="0">
            <span class="md-title">MaterialsMine</span>
        </md-toolbar>
        <md-divider></md-divider>
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
                    <md-list-item class="md-inset">Chart Gallery</md-list-item>
                    <md-list-item class="md-inset">Image Gallery</md-list-item>
                </md-list>
            </md-list-item>
            <md-list-item md-expand>
                <md-icon class="utility-navfonticon">upload</md-icon>
                <span class="md-list-item-text utility-navfont">Upload</span>
                <md-list slot="md-expand">
                    <router-link :to="'/nm/xml-uploader'" v-slot="{navigate, href}" custom>
                        <md-list-item :href="href" @click="navigate"  class="md-inset">XML-Based Upload</md-list-item>
                    </router-link>
                    <router-link :to="'/mm/dataset-entry-form'" v-slot="{navigate, href}" custom>
                        <md-list-item :href="href" @click="navigate"  class="md-inset">Direct Dataset Entry Form</md-list-item>
                    </router-link>
                </md-list>
            </md-list-item>
            <md-list-item md-expand>
                <md-icon class="utility-navfonticon">handyman</md-icon>
                <span class="md-list-item-text utility-navfont">Tools</span>
                <md-list slot="md-expand">
                    <router-link :to="'/nm/modtools'" v-slot="{navigate, href}" custom>
                        <md-list-item :href="href" @click="navigate"  class="md-inset">Module Tools</md-list-item>
                    </router-link>
                    <router-link :to="'/nm/simtools'" v-slot="{navigate, href}" custom>
                        <md-list-item :href="href" @click="navigate"  class="md-inset">Simulation Tools</md-list-item>
                    </router-link>
                    <router-link :to="'/nm/chemprops'" v-slot="{navigate, href}" custom>
                        <md-list-item :href="href" @click="navigate"  class="md-inset">ChemProps</md-list-item>
                    </router-link>
                    <router-link :to="'/nm/plot-curation'" v-slot="{navigate, href}" custom>
                        <md-list-item :href="href" @click="navigate"  class="md-inset">Easy CSV Plotter</md-list-item>
                    </router-link>
                </md-list>
            </md-list-item>
            <md-list-item v-if="isAuthenticated">
                <md-icon class="utility-navfonticon">logout</md-icon>
                <span class="md-list-item-text utility-navfont">Log out</span>
            </md-list-item>
            <md-list-item v-else>
                <md-icon class="utility-navfonticon">login</md-icon>
                <span class="md-list-item-text utility-navfont">Login</span>
            </md-list-item>
      </md-list>
    </md-drawer>

</div>
</template>

<script>

export default {
  name: 'Drawer',
  data () {
    return {
      showSidebar: false
    }
  },
  computed: {
    isAuthenticated () {
      return this.$store.getters.isAuthenticated
    }
  }
}
</script>

<style scoped>
.md-drawer {
    z-index: 12;
}
</style>
