<template>
  <md-app>
    <md-app-toolbar
      class="md-app-toolbar md-dense md-primary md-theme-default"
      id="reset_bg"
    >
      <div class="md-toolbar-row viz-u-postion__rel">
        <div class="md-toolbar-section-start">
          <md-button class="md-icon-button" @click="toggleMenuVisibility">
            <md-icon>menu</md-icon>
          </md-button>

          <router-link to="/" class="header-logo">
            <span class="md-title"
              ><img id="logo" src="@/assets/img/materialsmine_logo_sm.png"
            /></span>
          </router-link>
        </div>
        <div class="md-toolbar-section-end header_nav">
          <div class="nav nav_menu u--inline">
            <ul>
              <li>
                <router-link to="/nm">NanoMine</router-link>
              </li>
              <li>
                <router-link to="/mm">Metamine</router-link>
              </li>
            </ul>
          </div>
          <div class="u--inline">
            <div v-if="isAuth" class="nav_menu--container">
              <a
                class="u--default-size nav_menu--handler u_color_white"
                style="font-size: 1.2rem !important"
              >
                Hi {{ displayName }}
              </a>
              <div class="nav_menu--siblings nav_menu--sibheader">
                <span
                  class="nav_menu--siblings-lists"
                  @click="store.dispatch('auth/logout')"
                  ><a id="authmenu">Logout</a></span
                >
              </div>
            </div>
            <div v-else>
              <a
                class="btn btn--tertiary btn--noradius"
                href="/secure"
                id="authmenu"
                >Login/Register</a
              >
            </div>
          </div>
        </div>
      </div>
    </md-app-toolbar>

    <md-app-drawer v-model:md-active="menuVisible">
      <Drawer id="leftdrawer" />
    </md-app-drawer>

    <md-app-content class="viz-u-postion__rel" v-if="isAdmin">
      <div class="md-layout u_width--max md-gutter md-alignment-top-center">
        <div
          class="md-layout-item md-size-60 md-medium-size-90 md-xsmall-size-95"
        >
          <ProfileHeader />
          <div
            class="u_margin-top-small u_display-flex section_md-header md-layout-row md-theme-demo-light md-scrollbar"
          >
            <!-- permanent drawer -->
            <SideNav />

            <div
              class="u_width--max md-content u--margin-pos utility-roverflow"
            >
              <div v-if="!!info.name">
                <h2
                  class="md-title u--color-black"
                  style="margin-bottom: 0.4rem"
                >
                  {{ info.name }}
                </h2>
              </div>
              <router-view />
            </div>
          </div>
        </div>
      </div>
    </md-app-content>
    <md-app-content
      class="u_margin-top-small u_display-flex section_md-header md-layout-row md-theme-demo-light md-scrollbar"
      v-else
    >
      <div class="md-size-20 u--margin-leftsm">
        <UserSideBar />
      </div>
      <div class="md-content u--margin-pos utility-roverflow u_width--max">
        <div class="u_width--max">
          <ProfileHeader />
          <div class="u_margin-top-small u_width--max">
            <div class="md-content u_width--max">
              <div v-if="!!info.name">
                <h2
                  class="md-title u--color-black"
                  style="margin-bottom: 0.4rem"
                >
                  {{ info.name }}
                </h2>
              </div>
              <router-view />
            </div>
          </div>
        </div>
      </div>
    </md-app-content>
  </md-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import SideNav from '@/components/portal/SideNav.vue';
import ProfileHeader from '@/components/portal/ProfileHeader.vue';
import Drawer from '@/components/Drawer.vue';
import UserSideBar from '@/components/portal/UserSideBar.vue';

defineOptions({
  name: 'PortalBase',
});

const store = useStore();
const menuVisible = ref(false);

const info = computed(() => store.getters['appHeaderInfo']);
const isAdmin = computed(() => store.getters['auth/isAdmin']);
const isAuth = computed(() => store.getters['auth/isAuthenticated']);
const displayName = computed(() => store.getters['auth/displayName']);

const toggleMenuVisibility = (): void => {
  menuVisible.value = !menuVisible.value;
};
</script>
