<template>
    <div>
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
        <header class="header">
            <!-- <analytics/> -->
            <div class="wrapper">
                <router-link to="/" class="header-logo">
                    <div class="">
                        <img src="../assets/img/materialsmine_logo.png" alt="MaterialsMine Logo">
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
                            <a class="u--default-size nav_menu--handler" style="color:#fff; font-size:1.2rem !important;" v-if="!isRunAs"><i class="material-icons" style="vertical-align: middle;">perm_identity</i> {{$store.getters.isAuthenticated ? !isRunAs ? userName : auth.getRunAsUser() : "Menu"}}</a>
                            <div class="nav_menu--siblings nav_menu--sibheader">
                                <span class="nav_menu--siblings-lists" @click="$store.commit('setLoginLogout')"><a href="#">Logout</a></span>
                            </div>
                           <!--<a v-else><i class="material-icons" style="vertical-align: bottom;">perm_identity</i> {{auth.getRunAsUser()}}</a>-->
                        </div>
                        <div v-else>
                            <a class="btn btn--tertiary btn--noradius" v-on:click="$store.commit('setLoginLogout')" href="#">Login/Register</a>
                        </div>
                        <!--<a class="btn btn--tertiary btn--normal" :href="getLoginLink()">Login/Register</a>-->
                    </div>
                </div>
            </div>
        </header>
        <div :class="['section_banner', info.type=='home' ? '' : 'section_banner__misc']">
            <div class="section_banner__text">
                <div v-if="info.type=='home'" class="section_banner__text-content">
                    <span class="u_adjust-banner-text">Welcome to {{info.name}}!</span>
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
                                    <router-link to="/about" class="nav_menu--siblings-lists"><a>About Us</a></router-link>
                                    <router-link to="/how" class="nav_menu--siblings-lists"><a>How To</a></router-link>
                                    <router-link to="/news" class="nav_menu--siblings-lists"><a>Research + News</a></router-link>
                                </div>
                            </div>
                        </li>
                        <li class="u_margin-right-small">
                            <div class="nav_menu--container">
                                <a class="u--default-size nav_menu--handler" href="#">Visualize</a>
                                <div class="nav_menu--siblings">
                                    <span class="nav_menu--siblings-lists" @click="links('/home')"><a href="/home">Browse Data</a></span>
                                    <span class="nav_menu--siblings-lists" @click="links(true,true)"><a href="/nm#/gallery">Chart Gallery</a></span>
                                    <span class="nav_menu--siblings-lists" @click="links('/nm#/imagegallery')"><a href="/nm#/imagegallery">Image Gallery</a></span>
                                </div>
                            </div>
                        </li>
                        <li class="u_margin-right-small">
                            <div class="nav_menu--container">
                                <a class="u--default-size nav_menu--handler" href="#">Upload</a>
                                <div class="nav_menu--siblings">
                                    <router-link to="/nm/xml-uploader" class="nav_menu--siblings-lists"><a>XML-Based Upload</a></router-link>
                                    <router-link to="/mm/dataset-entry-form" class="nav_menu--siblings-lists"><a>Direct Dataset Entry Form</a></router-link>
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
        <!-- <v-dialog v-model="logoutDialog" max-width="290">
            <v-card>
                <v-card-title class="headline blue lighten-2" primary-title>Log out</v-card-title>
                <v-card-text>
                    Log out of NanoMine?
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" flat="flat" @click="cancelLogout()">
                    No
                </v-btn>

                <v-btn color="blue darken-1" flat="flat" href="/nmr/doLogout">
                    Yes
                </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="loginDialog" max-width="290">
            <v-card>
                <v-card-title class="headline blue lighten-2" primary-title>Login</v-card-title>
                <v-card-text>
                    Log into NanoMine?
                </v-card-text>
                <v-card-text>
                    If you already have a Duke University account, proceed to login.  Otherwise create a <a href="https://accounts.oit.duke.edu/onelink/register" target="_blank">Duke OneLink</a> account.
                    <br/><strong>Coming Soon:</strong> InCommon support for using your own university's credentials for login. <a href="https://www.incommon.org/federation/incommon-federation-participants/" target="_blank">What is InCommon?</a>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" flat="flat" @click="$store.commit('resetLoginLogout')">
                    Cancel
                </v-btn>

                <v-btn color="blue darken-1" flat="flat" :href="getLoginLink()">
                    Login
                </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog> -->
    </div>
</template>
<script>
// import AppMixin from './mixins'
export default {
  name: 'Header',
  props: ['info']
  // mixins: [AppMixin],
}
</script>
