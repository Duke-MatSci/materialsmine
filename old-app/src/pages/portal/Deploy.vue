<template>
  <div>
    <div class="">
      <dialog-box :minWidth='40' :active="dialogBoxActive">
        <template v-slot:title>Alert</template>
        <template v-slot:content>You are about to shut down the server and rebuild, are you sure?</template>
        <template v-slot:actions>
          <md-button @click.native.prevent="shutDown">Yes</md-button>
          <md-button @click.native.prevent="closeDialogBox">No</md-button>
        </template>
      </dialog-box>
      <div v-if="loading" class="section_loader">
        <spinner :loading="true" :text="loadingMessage" />
      </div>

      <div v-else class="">
        <div class=" viz-u-mgup-sm utility-margin md-theme-default">
          <div class="md-card-header contactus_radios md-card-header-flex">
            <div class="md-card-header-text">
              <div class="md-body-1">
                This task requires super admin priviledges, deploying unapproved changes will require a rollback
              </div>
            </div>
          </div>
          <div class="md-card-actions md-alignment-right">
            <button @click.prevent="toggleDialogBox" class="md-button btn btn--tertiary btn--noradius">
              Pull and Deploy Latest Changes
            </button>
          </div>
          <md-divider class="u_margin-top-small"></md-divider>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
import dialogBox from '@/components/Dialog.vue'
import Spinner from '@/components/Spinner'
export default {
  name: 'Deploy',
  components: {
    dialogBox,
    Spinner
  },
  data () {
    return {
      loading: false,
      dialogTitle: 'Ready',
      dialogContent: 'Some Text',
      loadingMessage: '',
      headerText: false
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox',
      token: 'auth/token',
      isAdmin: 'auth/isAdmin'
    })
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    closeDialogBox () {
      if (this.dialogBoxActive) { this.toggleDialogBox() }
    },
    startProcess () {
      this.closeDialogBox()
      this.startLoading()
      setTimeout(() => this.shutDownMessage(), 120000)
      setTimeout(() => this.loadMessage(), 180000)
      setTimeout(() => this.checkServerStatus(), 300000)
    },
    endProcess () {
      this.$store.commit('setSnackbar', {
        message: 'Deployment Successful',
        duration: 3000
      })
      this.loading = false
      this.headerText = true
    },
    startLoading () {
      this.loadingMessage = 'Server is shutting down'
      this.loading = true
    },
    shutDownMessage () {
      this.loadingMessage = 'Server Shutdown Completed'
    },
    loadMessage () {
      this.loadingMessage = 'Loading Server'
    },
    async shutDown () {
      this.headerText = false
      try {
        const response = await fetch('/api/admin/call-script', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + this.token
          }
        })
        if (!response || response.statusText !== 'OK' || response.status !== 200) {
          const error = new Error(
            response?.message || 'Something went wrong!'
          )
          throw error
        }
        const responseData = await response.json()
        if (response.status === 200 && responseData.message === 'Successful') {
          this.startProcess()
        }
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: 'Something went wrong',
          action: () => this.shutDown()
        })
        this.closeDialogBox()
      }
    },
    async checkServerStatus () {
      try {
        const response = await fetch('/api/admin/confirm-script-call', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + this.token
          }
        })
        if (!response || response.statusText !== 'OK' || response.status !== 200) {
          const error = new Error(
            response?.message || 'Something went wrong!'
          )
          throw error
        }
        const responseData = await response.json()
        if (response.status === 200 && responseData.message === 'Successful') {
          this.endProcess()
        }
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: 'Restarting Deployment',
          duration: 3000
        })
        this.startProcess()
        this.closeDialogBox()
      }
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: '', name: 'Deploy' })
  }
}
</script>
