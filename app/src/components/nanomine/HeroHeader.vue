<template>
  <div
    :class="[
      'section_banner u--margin-neglg',
      info.pagetype == 'home' ? '' : 'section_banner__misc'
    ]"
  >
    <div class="section_banner__text">
      <div
        v-if="info.pagetype == 'home'"
        class="section_banner__text-content u_margin-top-small"
      >
        <span class="u_adjust-banner-text u_adjust-banner-text-home">{{
          info.name
        }}</span>
        <p class="u_adjust-banner-text_subtitle">{{ info.subtitle }}</p>
      </div>
      <div v-else class="section_banner__text-content">
        <i class="material-icons">{{ info.icon }}</i>
        <span class="u_adjust-banner-text">{{ info.name }}</span>
      </div>
    </div>
    <div class="section_banner__nav">
      <nav class="nav_menu">
        <ul>
          <li class="u_margin-right-small">
            <div class="nav_menu--container">
              <a class="u--default-size nav_menu--handler" href="#">About</a>
              <div class="nav_menu--siblings">
                <router-link to="/nm/about" class="nav_menu--siblings-lists"
                  ><a>About Us</a></router-link
                >
                <router-link to="/nm/how" class="nav_menu--siblings-lists"
                  ><a>How To</a></router-link
                >
                <router-link to="/nm/news" class="nav_menu--siblings-lists"
                  ><a>Research + News</a></router-link
                >
              </div>
            </div>
          </li>
          <li class="u_margin-right-small">
            <div class="nav_menu--container">
              <a class="u--default-size nav_menu--handler" href="#"
                >Visualize</a
              >
              <div class="nav_menu--siblings">
                <router-link to="/explorer" class="nav_menu--siblings-lists"
                  ><a>Browse Data</a></router-link
                >
                <router-link
                  to="/explorer/chart"
                  class="nav_menu--siblings-lists"
                  ><a>Chart Gallery</a></router-link
                >
                <router-link
                  to="/explorer/images"
                  class="nav_menu--siblings-lists"
                  ><a>Image Gallery</a></router-link
                >
                <router-link
                  to="/explorer/xmls"
                  class="nav_menu--siblings-lists"
                  ><a>View XMLs</a></router-link
                >
                <router-link
                  to="/explorer/dataset"
                  class="nav_menu--siblings-lists"
                  ><a>Dataset Gallery</a></router-link
                >
              </div>
            </div>
          </li>
          <li class="u_margin-right-small">
            <div class="nav_menu--container">
              <a class="u--default-size nav_menu--handler" href="#">Curate</a>
              <div class="nav_menu--siblings">
                <a
                  href="/explorer/curate/spreadsheet"
                  class="nav_menu--siblings-lists"
                  ><a>Spreadsheet Upload</a></a
                >
                <router-link
                  to="/explorer/curate/sdd"
                  class="nav_menu--siblings-lists"
                  ><a>Upload with SDD</a></router-link
                >
                <router-link
                  to="/explorer/curate/stepper"
                  class="nav_menu--siblings-lists"
                  ><a>Form Curation</a></router-link
                >
                <router-link
                  to="/explorer/chart/editor/new"
                  class="nav_menu--siblings-lists"
                  ><a>Create Chart</a></router-link
                >
              </div>
            </div>
          </li>
          <li class="u_margin-right-small">
            <div class="nav_menu--container">
              <a class="u--default-size nav_menu--handler" href="#">Tools</a>
              <div class="nav_menu--siblings">
                <router-link
                  to="/explorer/sparql"
                  class="nav_menu--siblings-lists"
                  ><a>Sparql Query</a></router-link
                >
                <router-link
                  to="/explorer/tools"
                  class="nav_menu--siblings-lists"
                  ><a>Module & Simulation Tools</a></router-link
                >
                <router-link
                  to="/nm/tools/plot-curation"
                  class="nav_menu--siblings-lists"
                  ><a>Easy CSV Plotter</a></router-link
                >
                <a href="/api/api-docs/" class="nav_menu--siblings-lists"
                  ><a>API Documentation</a></a
                >
              </div>
            </div>
          </li>
          <li class="u_margin-right-small">
            <div class="nav_menu--container">
              <a class="u--default-size nav_menu--handler" href="#"
                >Conferences</a
              >
              <div class="nav_menu--siblings">
                <router-link to="/nm/mrs2022" class="nav_menu--siblings-lists"
                  ><a>MRS 2022</a></router-link
                >
                <router-link to="/nm/cssi2023" class="nav_menu--siblings-lists"
                  ><a>CSSI 2023</a></router-link
                >
                <router-link
                  to="/nm/2024-doe-poster"
                  class="nav_menu--siblings-lists"
                  ><a>2024 DOE Poster</a></router-link
                >
              </div>
            </div>
          </li>
          <li class="u_margin-right-small" v-if="isAuth">
            <div v-if="!isAdmin" class="nav_menu--container">
              <router-link class="u--default-size" to="/portal/user">
                <span>My Portal</span></router-link
              >
            </div>
            <div v-else class="nav_menu--container">
              <router-link class="u--default-size" to="/portal">
                <span>Admin Center</span></router-link
              >
            </div>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'HeroHeader',
  props: ['toggler'],
  computed: {
    ...mapGetters({
      info: 'appHeaderInfo',
      isAuth: 'auth/isAuthenticated',
      isAdmin: 'auth/isAdmin',
      displayName: 'auth/displayName'
    })
  }
}
</script>
