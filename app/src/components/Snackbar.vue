<template>
  <div>
    <md-snackbar :md-position="position" :md-active.sync="show" :md-duration="duration">
      {{message}}
      <span>
        <md-button v-if="action" id="snackbarAction" class="md-primary" @click.native="callAction">Retry</md-button>
        <md-button v-else id="snackbarRefresh" class="md-primary" @click.native="refresh">Refresh</md-button>
        <md-button id="snackbarClose" class="md-primary" @click.native="show = false">Close</md-button>
      </span>
    </md-snackbar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'Snackbar',
  props: {
    position: {
      type: String,
      required: false,
      default: 'center'
    }
  },
  data () {
    return {
      show: false,
      message: '',
      action: null,
      duration: 5000
    }
  },
  computed: {
    ...mapGetters({
      snackbar: 'getSnackbar'
    })
  },
  methods: {
    refresh () {
      this.$router.go(0)
    },
    // If an action has been passed through vuex as a callback, call it
    callAction () {
      if (this.action) {
        this.action()
      }
    }
  },
  watch: {
    snackbar (val, oldVal) {
      if (val.message) {
        this.show = true
        this.message = this.snackbar?.message
        this.action = this.snackbar?.action || null
        this.duration = this.snackbar?.duration || 5000
        // Reset
        this.$store.commit('setSnackbar', '')
      }
    }
  }
}
</script>
