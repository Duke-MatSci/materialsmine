<template>
  <md-snackbar md-position="center" :md-active.sync="show">
    {{message}}
    <md-button class="md-primary" @click.native="show = false">Close</md-button>
  </md-snackbar>
</template>

<script>
/*
NOTE: There are two snackbar implementations for review
This version ("Snackbar 2") uses computed properties to find the message,
and watches the Vuex store state to determine whether to show or hide. 

- Pro: A MUCH simpler implementation. Automatically closes after a couple seconds
- Con: Doesn't allow as much customization (only can pass a string message, nothing else).
  It's probably not great practice to watch the Vuex store 
  Also there's something weird with the styling that needs looking into
*/
import { mapGetters } from 'vuex'
export default {
  data () {
    return {
      show: false,
      message: '',
    }
  },
  computed: {
    ...mapGetters({
      messageVuex: 'getSnackMsg'
    })
  },
  watch: {
    messageVuex(val, oldVal) {
      if (val !== '') {
        this.show = true
        this.message = this.messageVuex
        this.$store.commit('setSnackMsg', '')
      }
    }
  }
}
</script>