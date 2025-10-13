<template>
  <div class="md-app-side-drawer u_display-flex u--layout-flex-column">
    <!-- fix style="min-height: 80vh" -->
    <div
      v-if="sideDrawerVisiblity"
      style="min-height: 80vh"
      class="md-app-internal-drawer u--layout-flex u--layout-flex-column u--layout-flex-justify-sb metamine_footer-ref-header"
    >
      <md-list md-expand-single="true" class="utility-transparentbg">
        <button
          v-if="sideDrawerVisiblity"
          class="utility-gridborder return-btn return-btn-text u--margin-leftsm"
          style="place-self: end"
          @click="toggleSideDrawerVisibility"
        >
          <md-icon class="return-btn-text metamine_intro-header u_margin-none"
            >keyboard_arrow_left</md-icon
          >
          <md-tooltip md-direction="right">Close Menu</md-tooltip>
        </button>
        <router-link :to="'/portal/user'">
          <md-list-item>
            <i class="md-icon md-icon-font u--default-size md-theme-default">manage_accounts</i>
            <span class="md-list-item-text utility-navfont">Account</span>
          </md-list-item>
        </router-link>
        <md-divider></md-divider>

        <md-list-item md-expand>
          <md-icon class="utility-navfonticon">bar_chart</md-icon>
          <span class="md-list-item-text utility-navfont">Chart</span>
          <template #md-expand>
            <md-list>
              <router-link to="/portal/user/favorite-charts">
                <md-list-item class="md-inset">Favorite Chart</md-list-item>
              </router-link>
            </md-list>
          </template>
        </md-list-item>
        <md-divider></md-divider>

        <md-list-item md-expand>
          <md-icon class="utility-navfonticon">account_tree</md-icon>
          <span class="md-list-item-text utility-navfont">My Curations</span>
          <template #md-expand>
            <md-list>
              <router-link :to="'/portal/user/approved-curations'">
                <md-list-item class="md-inset">
                  <md-icon class="utility-navfonticon">thumb_up_alt</md-icon>Approved
                  Curations</md-list-item
                >
              </router-link>
              <router-link to="/portal/user/unapproved-curations">
                <md-list-item class="md-inset">
                  <md-icon class="utility-navfonticon">hive</md-icon>Unapproved Curations
                </md-list-item>
              </router-link>
            </md-list>
          </template>
        </md-list-item>

        <md-divider></md-divider>
      </md-list>
    </div>

    <button
      v-if="!sideDrawerVisiblity"
      class="utility-gridborder return-btn metamine_footer-ref-header"
      @click="toggleSideDrawerVisibility"
    >
      <md-icon class="return-btn-text metamine_intro-header u_margin-none"
        >keyboard_arrow_right</md-icon
      >
      <md-tooltip md-direction="right">Open Menu</md-tooltip>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const sideDrawerVisiblity = ref(true);

const toggleSideDrawerVisibility = () => {
  sideDrawerVisiblity.value = !sideDrawerVisiblity.value;
};
</script>
