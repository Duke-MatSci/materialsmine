<template>
  <div class="u_margin-top-small">
    <div class="u_display-flex u--layout-flex-justify-fs" style="align-items: center;">
      <md-avatar class="md-avatar-icon md-large md-primary u_margin-none u--bg utility-gridborder">
        <md-ripple class="md-title">
          <router-link class="viz-tab__button" :to="{ name: 'PortalHome' }">{{ getInitials }}</router-link>
        </md-ripple>
      </md-avatar>
      <div class="u--margin-pos">
        <p class="u--color-primary md-body-1">{{ displayName ?? 'Welcome' }}</p>
        <p class="u--color-grey md-caption">Your Admin Center</p>
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
      displayName: 'auth/displayName',
      user: 'auth/user'
    }),
    getInitials () {
      if (this.user?.givenName && this.user?.surName) {
        return `${this.user?.givenName?.charAt(0)}${this.user?.surName?.charAt(0)}`
      }
      return 'MM'
    }
  }
}
</script>
