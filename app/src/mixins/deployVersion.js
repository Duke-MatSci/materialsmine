import { mapMutations, mapGetters, mapActions, mapState } from 'vuex'

export default {
  data () {
    return {
      errorMsg: 'Deployment Failed'
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox',
      token: 'auth/token',
      isAdmin: 'auth/isAdmin'
    }),
    isProduction () {
      // Version toggling is only enabled for production and not lower environment.
      return new URL(window.location.origin)?.host === 'materialsmine.org'
      // return new URL(window.location.origin)?.host === 'localhost';
    },
    ...mapState('portal', [
      'isSuccess',
      'isError',
      'isLoading',
      'currentVersion',
      'loadingMessage',
      'dockerVersions'
    ])
  },

  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox',
      setCurrentVersion: 'setCurrentVersion',
      resetDeploymentStatus: 'portal/resetDeploymentStatus'
    }),
    ...mapActions({
      fetchVersions: 'portal/fetchVersions',
      deploy: 'portal/deploy'
    }),

    // this closes the dialog box and resets the deployment status
    closeDialogBox () {
      this.toggleDialogBox()
      this.resetDeploymentStatus()
    },
    setVersion (e) {
      this.$store.commit('portal/setCurrentVersion', e.target.value)
    }
  },
  watch: {
    dialogBoxActive () {
      if (this.dialogBoxActive === false) {
        this.resetDeploymentStatus()
      }
    }
  }
}
