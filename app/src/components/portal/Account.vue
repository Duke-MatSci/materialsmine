<template>
  <div>
    <div>
      <div class="md-card-header contactus_radios md-card-header-flex">
        <div class="md-card-header-text">
          <div class="md-body-1">Here is a summary of your account details</div>
        </div>
      </div>
      <md-divider class="u_margin-top-small"></md-divider>
    </div>

    <div class="article_citations">
      <div>
        <div class="md-layout md-gutter viz-u-mgbottom-big">
          <div class="md-layout-item md-size-50 md-gutter">
            <h4 class="u--color-grey-sec md-button-content">surname</h4>
            <p>{{ user.surName }}</p>
          </div>

          <div class="md-layout-item md-size-50 md-gutter">
            <h4 class="u--color-grey-sec md-button-content">given name</h4>
            <p>{{ user.givenName }}</p>
          </div>
        </div>

        <div class="md-layout md-gutter viz-u-mgbottom-big">
          <div class="md-layout-item md-size-50 md-gutter">
            <h4 class="u--color-grey-sec md-button-content">Status</h4>
            <p>{{ isAdmin ? 'Admin' : 'Member' }}</p>
          </div>

          <div class="md-layout-item md-size-50 md-gutter">
            <h4 class="u--color-grey-sec md-button-content">
              Token Expiration
            </h4>
            <p>{{ hours }}</p>
          </div>
        </div>

        <div class="">
          <h4 class="u--color-grey-sec md-button-content">token</h4>
          <div
            style="word-wrap: break-word"
            class="md-card-header chart_editor__right-view"
          >
            {{ token }}
          </div>
          <div
            class="md-card-actions md-alignment-right chart_editor__right-view"
          >
            <button
              @click.prevent="copyContent"
              class="md-button btn btn--primary btn--noradius"
            >
              <span class="md-caption u--bg">Copy token</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'Account',
  data () {
    return {
      hours: 0
    }
  },
  computed: {
    ...mapGetters({
      token: 'auth/token',
      user: 'auth/user',
      isAdmin: 'auth/isAdmin'
    })
  },
  methods: {
    async copyContent () {
      try {
        await navigator.clipboard.writeText(this.token)
        this.$store.commit('setSnackbar', {
          message: 'Token copied successfully',
          duration: 4000
        })
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: 'Something went wrong',
          action: () => this.copyContent()
        })
      }
    },
    countDown () {
      const tokenExpiration = localStorage.getItem('tokenExpiration')
      if (!tokenExpiration) {
        this.hours = 'Token already expired'
        return
      }

      const expiresIn =
        new Date(+tokenExpiration).getTime() - new Date().getTime()
      if (expiresIn <= 0) {
        this.hours = 'Token already expired'
        return
      }

      this.hours = `Expires in ${
        Math.round((expiresIn / (60 * 60 * 1000)) * 100) / 100
      } hours`
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', {
      icon: '',
      name: 'Account Information'
    })
    this.countDown()
  }
}
</script>
