<template>
  <div class="page-not-found">
    <i class="material-icons page-not-found-header u--padding-zero">lock_person</i>
    <h2 class="u_margin-bottom-small">Login required</h2>
    <p>
      The page you are trying to access requires authentication. Would you like to
      <a href="/secure">log in</a> or return to the
      <router-link to=""><a @click="goBack">previous page</a></router-link
      >?
    </p>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

// Component name for debugging
defineOptions({
  name: 'LoginRequired',
});

// Router
const router = useRouter();

// Methods
const goBack = () => {
  router.go(-1);
};
</script>
