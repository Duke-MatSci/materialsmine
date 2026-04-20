<template>
  <div class="u_margin-top-small">
    <div
      class="u_display-flex u--layout-flex-justify-fs"
      style="align-items: center"
    >
      <router-link class="viz-sample__loading" :to="{ name: 'PortalHome' }">
        <md-avatar
          class="md-avatar-icon md-large md-primary u_margin-none u--bg utility-gridborder"
        >
          <md-ripple class="md-title">
            {{ getInitials }}
          </md-ripple>
        </md-avatar>
      </router-link>
      <div class="u--margin-pos">
        <p class="u--color-primary md-body-1">{{ displayName }}</p>
        <p class="u--color-grey md-caption">{{ info.name }}</p>
      </div>
    </div>
    <md-divider class="u_margin-top-small"></md-divider>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const info = computed(() => store.getters['appHeaderInfo']);
const displayName = computed(() => store.getters['auth/displayName']);
const user = computed(() => store.getters['auth/user']);

const getInitials = computed(() => {
  if (user.value?.givenName && user.value?.surName) {
    return `${user.value?.givenName?.charAt(0)}${user.value?.surName?.charAt(
      0
    )}`;
  }
  return 'MM';
});
</script>
