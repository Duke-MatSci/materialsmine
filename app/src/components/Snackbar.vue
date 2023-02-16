<template>
  <div>
    <md-snackbar :md-position="position" :md-active.sync="show" :md-duration="isInfinity">
      {{message}}
      <span>
        <md-button v-if="action" id="snackbarAction" class="md-primary" @click.native="callAction">Retry</md-button>
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
      isInfinity: Infinity
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
        // Toggle the snackbar before calling the action to reload it's timer
        this.show = false
        this.action()
        this.show = false
      }
    }
  },
  watch: {
    snackbar (val, oldVal) {
      if (val.message) {
        this.show = true
        this.message = this.snackbar.message
        this.action = this.snackbar.action || null
        // Reset
        this.$store.commit('setSnackbar', '')
      }
    }
  }
}
</script>
