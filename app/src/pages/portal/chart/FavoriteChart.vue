<template>
  <chart-gallery sender="Favourite Chart" :isFavourite="isAuth" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'
import ChartGallery from '@/components/ChartGallery.vue'

const store = useStore()

const isAuth = computed(() => store.getters['auth/isAuthenticated'])
</script>
