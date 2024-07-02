<template>
  <div>
    <div class="">
      <!-- Success Dialog Box -->
      <dialog-box :minWidth="40" :active="dialogBoxActive">
        <template v-slot:title>Alert</template>
        <template v-slot:content>
          <!-- THIS RENDERS SUCCESS -->
          <div
            v-if="isSuccess"
            class="u_display-flex u_centralize_items u--margin-posmd"
          >
            <md-icon class="u--font-emph-smm u--margin-pos" style="color: green"
              >check_circle</md-icon
            >
            <span>Version {{ currentVersion }} deployed successfully!</span>
          </div>

          <!-- THIS RENDERS ERROR -->
          <div
            v-else-if="isError"
            class="u_display-flex u_centralize_items u--margin-posmd"
          >
            <md-icon class="u--font-emph-smm u--margin-pos" style="color: red"
              >error_outline</md-icon
            >
            <span>{{ errorMsg }}</span>
          </div>

          <!-- THIS IS NEUTRAL -->
          <div v-else>
            <p>
              You are about to shut down the server and rebuild, are you sure?
            </p>
          </div>
        </template>
        <template v-slot:actions>
          <md-button v-if="isSuccess" @click.native.prevent="closeDialogBox"
            >Ok</md-button
          >

          <div v-else-if="isError">
            <md-button @click.native.prevent="() => deploy('general')"
              >Try again</md-button
            >
            <a href="/nm/contact"><md-button>Contact support</md-button></a>
          </div>

          <div v-else>
            <md-button @click.native.prevent="() => deploy('general')"
              >Yes</md-button
            >
            <md-button @click.native.prevent="closeDialogBox">No</md-button>
          </div>
        </template>
      </dialog-box>

      <div v-if="isLoading" class="section_loader">
        <spinner :isLoading="true" :text="loadingMessage" />
      </div>

      <div v-else class="">
        <div class="viz-u-mgup-sm utility-margin md-theme-default">
          <div class="md-card-header contactus_radios md-card-header-flex">
            <div class="md-card-header-text">
              <div class="md-body-1">
                This task requires admin priviledges, deploying unapproved
                changes will require a rollback
              </div>
            </div>
          </div>
          <div
            v-if="isProduction"
            class="u_width--max u_display-flex u_centralize_items u--layout-flex-justify-sb"
          >
            <div class="utility_roverflow" v-if="isProduction">
              <div class="form__field md-field">
                <select
                  @change="(e) => setVersion(e)"
                  :value="currentVersion"
                  class="explorer_page_footer-text u_width--max"
                  name="filterBy"
                  id="filterBy"
                >
                  <option value="" disabled selected>Select a version</option>
                  <option
                    v-for="(version, id) in dockerVersions"
                    :key="id"
                    :value="version"
                  >
                    {{ version }}
                  </option>
                </select>
              </div>
            </div>

            <button
              @click.prevent="toggleDialogBox"
              :disabled="!dockerVersions"
              class="md-button btn btn--tertiary btn--noradius"
            >
              Pull and Deploy
            </button>
          </div>
          <div
            v-if="!isProduction"
            class="u_width--max u_display-flex u_centralize_items u--layout-flex-justify-end"
          >
            <button
              @click.prevent="toggleDialogBox"
              class="md-button btn btn--tertiary btn--noradius"
            >
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
import dialogBox from '@/components/Dialog.vue'
import Spinner from '@/components/Spinner'
import deployVersion from '@/mixins/deployVersion'
export default {
  name: 'GeneralDeployment',
  mixins: [deployVersion],
  components: {
    dialogBox,
    Spinner
  },
  created () {
    this.isProduction && this.fetchVersions()
    this.$store.commit('setAppHeaderInfo', {
      icon: '',
      name: 'General Deployment'
    })
  }
}
</script>
