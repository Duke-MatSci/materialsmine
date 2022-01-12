<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<style lang="scss">
@import './assets/css/style.scss';
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: $primary-white;
}

#nav {
  padding: 30px;

  a {
    &.router-link-exact-active {
      color: $tertiary;
    }
  }
}
</style>
