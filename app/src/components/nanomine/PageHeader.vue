<template>
    <div>
        <header class="header">
            <div class="wrapper">
                <router-link to="/" class="header-logo">
                    <div class="">
                        <img src="@/assets/img/materialsmine_logo.png" alt="MaterialsMine Logo">
                    </div>
                </router-link>
                <div class="nav_mobile-icon">
                    <div class="nav_mobile-icon-menu"></div>
                </div>
                <div class="header_nav">
                    <div class="nav nav_menu u--inline">
                        <ul>
                            <li><a href="/nm">NanoMine</a></li>
                            <li><a href="/mm">MetaMine</a></li>
                        </ul>
                    </div>
                    <div class="u--inline">
                        <div v-if="$store.getters.isAuthenticated" class="nav_menu--container">
                            <a class="u--default-size nav_menu--handler" style="color:#fff; font-size:1.2rem !important;">
                                <i class="material-icons" style="vertical-align: middle;">perm_identity</i>
                            </a>
                            <div class="nav_menu--siblings nav_menu--sibheader">
                                <span class="nav_menu--siblings-lists" @click="$store.dispatch('logout')"><a>Logout</a></span>
                            </div>
                        </div>
                        <div v-else>
                            <a class="btn btn--tertiary btn--noradius">Login/Register</a>
                        </div>
                    </div>
                </div>
            </div>
        </header>
        <div :class="['section_banner', info.pagetype=='home' ? '' : 'section_banner__misc']">
            <div class="section_banner__text">
                <div v-if="info.pagetype=='home'" class="section_banner__text-content">
                    <span class="u_adjust-banner-text">{{ info.name }}</span>
                    <p class="u_adjust-banner-text_subtitle">{{info.subtitle}}</p>
                </div>
                <div v-else class="section_banner__text-content">
                    <i class="material-icons">{{info.icon}}</i>
                    <span class="u_adjust-banner-text">{{ info.name }}</span>
                </div>
            </div>
            <div class="section_banner__nav">
                <nav class="nav_menu">
                    <ul class="nav_ul">
                        <li class="u_margin-right-small">
                            <div class="nav_menu--container">
                                <a class="u--default-size nav_menu--handler" href="#">About</a>
                                <div class="nav_menu--siblings">
                                    <router-link to="about" class="nav_menu--siblings-lists"><a>About Us</a></router-link>
                                    <router-link to="how" class="nav_menu--siblings-lists"><a>How To</a></router-link>
                                    <router-link to="news" class="nav_menu--siblings-lists"><a>Research + News</a></router-link>
                                </div>
                            </div>
                        </li>
                        <li class="u_margin-right-small">
                            <div class="nav_menu--container">
                                <a class="u--default-size nav_menu--handler" href="#">Visualize</a>
                                <div class="nav_menu--siblings">
                                    <router-link to="/explorer" class="nav_menu--siblings-lists"><a>Browse Data</a></router-link>
                                    <router-link to="/explorer/chart-gallery" class="nav_menu--siblings-lists"><a>Chart Gallery</a></router-link>
                                    <router-link to="/explorer/image-gallery" class="nav_menu--siblings-lists"><a>Image Gallery</a></router-link>
                                </div>
                            </div>
                        </li>
                        <li class="u_margin-right-small">
                            <div class="nav_menu--container">
                                <a class="u--default-size nav_menu--handler" href="#">Upload</a>
                                <div class="nav_menu--siblings">
                                    <router-link to="/nm/xml-uploader" class="nav_menu--siblings-lists"><a>XML-Based Upload</a></router-link>
                                    <router-link to="/explorer/dataset-entry-form" class="nav_menu--siblings-lists"><a>Direct Dataset Entry Form</a></router-link>
                                </div>
                            </div>
                        </li>
                        <li class="u_margin-right-small">
                            <div class="nav_menu--container">
                                <a class="u--default-size nav_menu--handler" href="#">Tools</a>
                                <div class="nav_menu--siblings">
                                    <router-link to="/nm/modtools" class="nav_menu--siblings-lists"><a>Module Tools</a></router-link>
                                    <router-link to="/nm/simtools" class="nav_menu--siblings-lists"><a>Simulation Tools</a></router-link>
                                    <router-link to="/nm/chemprops" class="nav_menu--siblings-lists"><a>ChemProps</a></router-link>
                                    <router-link to="/nm/plot-curation" class="nav_menu--siblings-lists"><a>Easy CSV Plotter</a></router-link>
                                </div>
                            </div>
                        </li>
                        <li class="u_margin-right-small" v-if="$store.getters.isAuthenticated">
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
  computed: {
    ...mapGetters({
      info: 'appHeaderInfo'
    })
  }
}
</script>
