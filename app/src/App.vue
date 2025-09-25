<template>
  <div id="app" class="page-container">
    <router-view />
    <Snackbar />
  </div>
</template>

<style lang="scss">
@import './assets/css/style.scss';
</style>

<script setup lang="ts">
import Snackbar from '@/components/Snackbar.vue';
import { useStore } from 'vuex';

const store = useStore();

(async function created() {
  await store.dispatch('auth/tryLogin');
})();
</script>
