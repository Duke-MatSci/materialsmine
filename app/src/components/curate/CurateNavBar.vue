<template>
  <div>
    <div class="curate-menu">
      <md-button
        class="md-icon-button"
        @click.native.prevent="navBack"
      >
        <md-tooltip md-direction="bottom">
          Go Back
        </md-tooltip>
      <md-icon>arrow_back</md-icon>
      </md-button>
        <div v-for="(route, index) in navRoutes"
          :key="index"
          class="curate-menu-routes"
        >
          <router-link :to="route.path" v-slot="{navigate, href}" custom>
            <a :href="href" @click="navigate">
              {{route.label}}
            </a>
          </router-link>
          <span class="md-icon-button"> > </span>
        </div>
        <span class="curate-menu-routes"> {{active}} </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CurateNavBar',
  props: {
    navRoutes: {
      type: Array,
      required: false,
      default: () => []
    },
    active: {
      type: String,
      required: true,
      default: ''
    }
  },
  methods: {
    async navBack () {
      this.$router.back()
    }
  }
}
</script>
