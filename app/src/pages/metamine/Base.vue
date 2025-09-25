<template>
  <div
    id="metamine_app"
    class="md-app md-app-side-drawer md-layout-row md-waterfall md-fixed md-theme-default"
  >
    <!-- Navigation Drawer -->
    <md-drawer :md-active="menuVisible" @update:md-active="handleDrawerUpdate">
      <Drawer id="leftdrawer" />
    </md-drawer>

    <!-- Main Content -->
    <main
      class="md-app-container md-flex md-layout-column md-theme-default md-scrollbar"
      style="padding-left: 0px"
    >
      <PageHeader :toggleMenu="toggleMenu" />
      <div class="md-app-scroller md-layout-column md-flex md-theme-default md-scrollbar">
        <div class="u--padding-zero u_height--max">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageHeader from '@/components/metamine/PageHeader.vue';
import Drawer from '@/components/Drawer.vue';

// Component name for debugging
defineOptions({
  name: 'MetamineBase',
});

// Reactive data
const menuVisible = ref<boolean>(false);

// Methods
const toggleMenu = (): void => {
  menuVisible.value = !menuVisible.value;
};

const handleDrawerUpdate = (value: boolean): void => {
  menuVisible.value = value;
};
</script>

<style scoped>
#metamine_app {
  font-size: 14px !important;
}
</style>
