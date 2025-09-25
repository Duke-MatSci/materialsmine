<template>
  <div class="u_margin-top-small">
    <div
      class="u_display-flex u--layout-flex-justify-fs"
      style="align-items: center"
    >
      <router-link class="viz-sample__loading" :to="{ name: 'PortalHome' }">
        <md-avatar
          class="md-avatar-icon md-large md-primary u_margin-none u--bg utility-gridborder"
        >
          <md-ripple class="md-title">
            {{ getInitials }}
          </md-ripple>
        </md-avatar>
      </router-link>
      <div class="u--margin-pos">
        <p class="u--color-primary md-body-1">{{ displayName }}</p>
        <p class="u--color-grey md-caption">{{ info.name }}</p>
      </div>
    </div>
    <md-divider class="u_margin-top-small"></md-divider>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'ProfileHeader',
  computed: {
    ...mapGetters({
      info: 'appHeaderInfo',
      displayName: 'auth/displayName',
      user: 'auth/user'
    }),
    getInitials () {
      if (this.user?.givenName && this.user?.surName) {
        return `${this.user?.givenName?.charAt(0)}${this.user?.surName?.charAt(
          0
        )}`
      }
      return 'MM'
    }
  }
}
</script>
