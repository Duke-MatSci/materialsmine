<template>
  <md-app md-waterfall md-mode="fixed-last">
    <md-app-toolbar :toggler="toggleMenu" />
    <md-app-drawer v-model:md-active="toggleMenuVisibility">
      <drawers />
    </md-app-drawer>
    <md-app-content>
      <router-view />
    </md-app-content>
  </md-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageHeader from '@/components/portal/Header.vue';
import Drawers from '@/components/Drawer.vue';

defineOptions({
  name: 'ExplorerBase',
  components: {
    mdAppToolbar: PageHeader,
    Drawers
  }
});

const toggleMenuVisibility = ref<boolean>(false);

const toggleMenu = (): void => {
  toggleMenuVisibility.value = !toggleMenuVisibility.value;
};
</script>
