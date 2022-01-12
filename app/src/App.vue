<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view/>
    <page-footer id="footer"></page-footer>
  </div>
</template>

<script>
import PageFooter from '@/components/PageFooter.vue'

export default {
  components: {
    PageFooter
  }
}
</script>

<style lang="scss">
@import './assets/css/style.scss';
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: $primary;
  background-color: $primary-white;
}

#header, #footer {
  text-align: left;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    // color: #2c3e50;
    color: $primary-grey;

    &.router-link-exact-active {
      // color: #42b983;
      color: $tertiary;
    }
  }
}
</style>
