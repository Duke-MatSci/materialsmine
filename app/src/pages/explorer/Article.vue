<template>
  <md-app md-waterfall md-mode="fixed-last">
    <md-app-toolbar :toggler='toggleMenu' />
    <md-app-drawer :md-active.sync="toggleMenuVisibility">
      <drawer />
    </md-app-drawer>
    <md-app-content>
      <!-- **** Content Goes Here *** -->
      <div class="article">
        <h1>{{ doi }}</h1>
      </div>
    </md-app-content>
  </md-app>
</template>

<script>
export default {
  name: 'Article',
  props: {
    doi: {
      type: String,
      default: '10.1002/polb.20925'
    }
  },
  data: async (vm) => {
    return {
      SS_response: await (fetch(`https://api.semanticscholar.org/v1/paper/` + vm.doi)).json()
    }
  }
}
</script>
