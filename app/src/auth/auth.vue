<template><div></div></template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

defineOptions({ name: 'Auth' });

const route = useRoute();
const store = useStore();

onMounted(() => {
  store.dispatch('auth/authProcessor', route.params.auth);
});
</script>
