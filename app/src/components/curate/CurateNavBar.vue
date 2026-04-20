<template>
  <div>
    <div class="curate-menu">
      <md-button class="md-icon-button" @click.prevent="navBack">
        <md-tooltip md-direction="bottom">Go Back</md-tooltip>
        <md-icon>arrow_back</md-icon>
      </md-button>
      <div v-for="(route, index) in navRoutes" :key="index" class="curate-menu-routes">
        <router-link :to="route.path" v-slot="{ navigate, href }" custom>
          <a :href="href" @click="navigate">{{ route.label }}</a>
        </router-link>
        <span class="md-icon-button"> > </span>
      </div>
      <span class="curate-menu-routes">{{ active }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

// Component name for debugging
defineOptions({
  name: 'CurateNavBar',
});

// Props
interface NavRoute {
  path: string;
  label: string;
}

interface Props {
  navRoutes?: NavRoute[];
  active: string;
}

const props = withDefaults(defineProps<Props>(), {
  navRoutes: () => [],
  active: '',
});

// Router
const router = useRouter();

// Methods
const navBack = () => {
  router.back();
};
</script>
