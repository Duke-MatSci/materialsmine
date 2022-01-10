<template>
  <div id="app" class="page-container">
    <mdDrawer id="leftdrawer"></mdDrawer>
    <page-header id="header" :info="info"></page-header>
    <!-- <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div> -->
    <router-view/>
  </div>
</template>

<script>
import PageHeader from '@/components/PageHeader.vue'
import Drawer from '@/components/drawer.vue'

export default {
  components: {
    PageHeader,
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
}

#header {
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
