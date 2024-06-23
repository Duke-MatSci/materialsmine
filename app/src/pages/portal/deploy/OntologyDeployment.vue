<template>
  <div>
    <div class="">
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
            v-if="isError"
            class="u_display-flex u_centralize_items u--margin-posmd"
          >
            <md-icon class="u--font-emph-smm u--margin-pos" style="color: red"
              >error_outline</md-icon
            >
            <span>{{ errorMsg }}</span>
          </div>

          <!-- THIS IS NEUTRAL -->
          <div v-if="!isSuccess && !isError">
            <p>
              You are about to pull the latest schema and deploy the updated
              ontology, are you sure?
            </p>
          </div>
        </template>
        <template v-slot:actions>
          <md-button v-if="isSuccess" @click.native.prevent="closeDialogBox"
            >Ok</md-button
          >

          <md-button v-if="isError" @click.native.prevent="deploy('ontology')"
            >Try again</md-button
          >
          <a href="/nm/contact" v-if="isError"
            ><md-button>Contact support</md-button></a
          >
          <md-button
            v-if="!isSuccess && !isError"
            @click.native.prevent="deploy('ontology')"
            >Yes</md-button
          >
          <md-button
            v-if="!isSuccess && !isError"
            @click.native.prevent="closeDialogBox"
            >No</md-button
          >
        </template>
      </dialog-box>

      <div v-if="isLoading" class="section_loader">
        <spinner :isLoading="true" :text="loadingMessage" />
      </div>

      <div v-else class="u_width--max">
        <div class="viz-u-mgup-sm utility-margin md-theme-default u_width--max">
          <div class="md-card-header contactus_radios md-card-header-flex">
            <div class="md-card-header-text">
              <div class="md-body-1">
                This pulls the latest schema and deploys the updated ontology
              </div>
            </div>
          </div>
          <div class="md-card-actions md-alignment-right">
            <button
              @click.prevent="toggleDialogBox"
              class="md-button btn btn--tertiary btn--noradius"
            >
              Deploy Ontology
            </button>
          </div>
          <md-divider class="u_margin-top-small"></md-divider>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dialogBox from '@/components/Dialog.vue';
import Spinner from '@/components/Spinner';
import deployVersion from '@/mixins/deployVersion';
export default {
  mixins: [deployVersion],
  name: 'OntologyDeployment',
  components: {
    dialogBox,
    Spinner
  },
  created() {
    this.$store.commit('setAppHeaderInfo', {
      icon: '',
      name: 'Ontology Deployment'
    });
    this.$store.commit('portal/setCurrentVersion', 'latest');
  }
};
</script>
