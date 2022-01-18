<template>
  <div id="app" class="page-container">
    <router-view />
  </div>
</template>

<style lang="scss">
@import 'assets/css/style.scss';
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: $primary;
  background-color: $primary-white;
}
</style>