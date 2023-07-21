<template>
    <div>
        <md-app-toolbar class="md-dense md-primary" id="reset_bg">
            <div class="md-toolbar-row viz-u-postion__rel">
                <div class="md-toolbar-section-start">
                    <md-button class="md-icon-button" @click="toggler">
                        <md-icon>menu</md-icon>
                    </md-button>

                    <router-link to="/" class="header-logo">
                        <span class="md-title"><img id="logo" src="@/assets/img/materialsmine_logo_sm.png"></span>
                    </router-link>
                </div>
                <div class="md-toolbar-section-end header_nav">
                    <div class="nav nav_menu u--inline">
                        <ul>
                            <li><router-link to="/nm" v-slot="{navigate, href}" custom><a :href="href" @click="navigate">NanoMine</a></router-link></li>
                            <li><router-link to="/mm" v-slot="{navigate, href}" custom><a :href="href" @click="navigate">Metamine</a></router-link></li>
                        </ul>
                    </div>
                    <div class="u--inline">
                        <div v-if="isAuth" class="nav_menu--container">
                            <a class="u--default-size nav_menu--handler" style="color:#fff; font-size:1.2rem !important;">
                                Hi {{ displayName }}
                            </a>
                            <div class="nav_menu--siblings nav_menu--sibheader">
                                <span class="nav_menu--siblings-lists" @click="$store.dispatch('auth/logout')"><a id="authmenu">Logout</a></span>
                            </div>
                        </div>
                        <div v-else>
                            <a class="btn btn--tertiary btn--noradius" href="/secure" id="authmenu">Login/Register</a>
                        </div>
                    </div>
                </div>
            </div>
        </md-app-toolbar>
        <div :class="['section_banner', info.pagetype=='home' ? '' : 'section_banner__misc']">
            <div class="section_banner__text">
                <div v-if="info.pagetype=='home'" class="section_banner__text-content">
                    <span class="u_adjust-banner-text u_adjust-banner-text-home">{{ info.name }}</span>
                    <p class="u_adjust-banner-text_subtitle">{{info.subtitle}}</p>
                </div>
                <div v-else class="section_banner__text-content">
                    <i class="material-icons">{{info.icon}}</i>
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
                                    <router-link to="/nm/about" class="nav_menu--siblings-lists"><a>About Us</a></router-link>
                                    <router-link to="/nm/how" class="nav_menu--siblings-lists"><a>How To</a></router-link>
                                    <router-link to="/nm/news" class="nav_menu--siblings-lists"><a>Research + News</a></router-link>
                                </div>
                            </div>
                        </li>
                        <li class="u_margin-right-small">
                            <div class="nav_menu--container">
                                <a class="u--default-size nav_menu--handler" href="#">Visualize</a>
                                <div class="nav_menu--siblings">
                                    <router-link to="/explorer" class="nav_menu--siblings-lists"><a>Browse Data</a></router-link>
                                    <router-link to="/explorer/chart" class="nav_menu--siblings-lists"><a>Chart Gallery</a></router-link>
                                    <router-link to="/explorer/images" class="nav_menu--siblings-lists"><a>Image Gallery</a></router-link>
                                    <router-link to="/explorer/xmls" class="nav_menu--siblings-lists"><a>View XMLs</a></router-link>
                                </div>
                            </div>
                        </li>
                        <li class="u_margin-right-small">
                            <div class="nav_menu--container">
                                <a class="u--default-size nav_menu--handler" href="#">Upload</a>
                                <div class="nav_menu--siblings">
                                    <a href="/explorer/curate/spreadsheet" class="nav_menu--siblings-lists"><a>Spreadsheet Upload</a></a>
                                    <router-link to="/explorer/curate/sdd" class="nav_menu--siblings-lists"><a>Upload with SDD</a></router-link>
                                </div>
                            </div>
                        </li>
                        <li class="u_margin-right-small">
                            <div class="nav_menu--container">
                                <a class="u--default-size nav_menu--handler" href="#">Tools</a>
                                <div class="nav_menu--siblings">
                                    <router-link to="/explorer/sparql" class="nav_menu--siblings-lists"><a>Sparql Query</a></router-link>
                                    <router-link to="/nm/tools/module_homepage" class="nav_menu--siblings-lists"><a>Module Tools</a></router-link>
                                    <!-- TODO 7/21/2023: The old Polymerizer is no longer functional.
                                      The old stewards of the tool are in the process of recovery, but there is currently no ETA. -->
                                    <!-- <router-link to="/nm/tools/simtools" class="nav_menu--siblings-lists"><a>Simulation Tools</a></router-link> -->
                                    <router-link to="/nm/tools/chemprops" class="nav_menu--siblings-lists"><a>ChemProps</a></router-link>
                                    <router-link to="/nm/tools/plot-curation" class="nav_menu--siblings-lists"><a>Easy CSV Plotter</a></router-link>
                                    <router-link to="" @click.native="loadApiDocs" class="nav_menu--siblings-lists"><a>Api Docs</a></router-link>
                                </div>
                            </div>
                        </li>
                        <li class="u_margin-right-small">
                            <div class="nav_menu--container">
                                <a class="u--default-size nav_menu--handler" href="#">MRS2022</a>
                                <div class="nav_menu--siblings">
                                    <a href="https://www.mrs.org/meetings-events/spring-meetings-exhibits/2022-mrs-spring-meeting/symposium-sessions/tutorial-sessions-detail/2022_mrs_spring_meeting/sf04/tutorial-sf04-leveraging-data-resources-for-functional" class="nav_menu--siblings-lists"><a>Tutorial Details</a></a>
                                    <a href="https://bit.ly/NMTUTORIAL" class="nav_menu--siblings-lists"><a>Tutorial Handout</a></a>
                                </div>
                            </div>
                        </li>
                        <li class="u_margin-right-small" v-if="isAuth">
                            <div class="nav_menu--container">
                                <a class="u--default-size" href="/mypage">My Portal</a>
                            </div>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
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
    })
  },
  methods: {
    loadApiDocs () {
      const url = `${location.origin}/api/api-docs/`
      return window.location.assign(url)
    }
  }
}
</script>
