<template>
  <div id="app" class="page-container">
    <router-view />
    <Snackbar/>
  </div>
</template>

<script>
import Snackbar from '@/components/Snackbar.vue'
export default {
  components: {
    Snackbar
  }
}
</script>

<style lang="scss">
  @import 'assets/css/style.scss';
</style>
