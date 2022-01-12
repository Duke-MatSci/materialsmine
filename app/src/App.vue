<template>
  <div id="app">
  <!-- <div id="app" class="page-container">
    <mdDrawer id="leftdrawer"></mdDrawer>
    <page-header id="header" :info="info"></page-header>
    <!-- <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div> -->
    <router-view />
    <!-- <page-footer id="footer"></page-footer> -->
  </div>
</template>

<script>
import PageHeader from '@/components/PageHeader.vue'
import PageFooter from '@/components/PageFooter.vue'
import Drawer from '@/components/drawer.vue'

export default {
  components: {
    PageHeader,
    PageFooter,
    MdDrawer: Drawer
  },
  computed: {
    info () {
      return this.$store.getters.appHeaderInfo
    }
  }
}
</script>

<style lang="scss">
@import '@/assets/css/style.scss';
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
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
    &.router-link-exact-active {
      color: $tertiary;
    }
  }
}
</style>
