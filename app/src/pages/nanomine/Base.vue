<template>
  <md-app md-waterfall md-mode="fixed">
    <!-- <div :style="xFlow"> -->
    <md-app-toolbar class="md-app-toolbar md-dense md-primary" id="reset_bg">
      <app-toolbar id="header" :toggler="toggleMenuVisibility" />
    </md-app-toolbar>
    <!-- </div> -->
    <md-app-content class="u--padding-zero u--layout-flex u--layout-flex-column">
      <HeroHeader />
      <router-view />
      <page-footer id="footer"></page-footer>
    </md-app-content>
    <md-app-drawer v-model:mdActive="menuVisible">
      <Drawer id="leftdrawer" />
    </md-app-drawer>
  </md-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppToolbar from '@/components/nanomine/PageHeader.vue';
import HeroHeader from '@/components/nanomine/HeroHeader.vue';
import PageFooter from '@/components/nanomine/PageFooter.vue';
import Drawer from '@/components/Drawer.vue';

// Reactive data
const menuVisible = ref<boolean>(false);

// Methods
const toggleMenuVisibility = (): void => {
  menuVisible.value = !menuVisible.value;
};
const xFlow = computed(() => ({ overflowX: 'clip' as const }));
// Define component name
defineOptions({
  name: 'NanomineBase',
});
</script>
