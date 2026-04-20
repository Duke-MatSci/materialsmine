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
          <md-button v-if="isSuccess" @click.prevent="closeDialogBox"
            >Ok</md-button
          >

          <div v-else-if="isError">
            <md-button @click.prevent="() => deploy('general')"
              >Try again</md-button
            >
            <a href="/nm/contact"><md-button>Contact support</md-button></a>
          </div>

          <div v-else>
            <md-button @click.prevent="() => deploy('general')"
              >Yes</md-button
            >
            <md-button @click.prevent="closeDialogBox">No</md-button>
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

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import dialogBox from '@/components/Dialog.vue';
import Spinner from '@/components/Spinner';

const store = useStore();

// Data
const errorMsg = ref<string>('Deployment Failed');

// Computed properties from store
const dialogBoxActive = computed<boolean>(() => store.getters.dialogBox);
const token = computed<string>(() => store.getters['auth/token']);
const isAdmin = computed<boolean>(() => store.getters['auth/isAdmin']);
const isSuccess = computed<boolean>(() => store.state.portal.isSuccess);
const isError = computed<boolean>(() => store.state.portal.isError);
const isLoading = computed<boolean>(() => store.state.portal.isLoading);
const currentVersion = computed<string>(() => store.state.portal.currentVersion);
const loadingMessage = computed<string>(() => store.state.portal.loadingMessage);
const dockerVersions = computed<string[]>(() => store.state.portal.dockerVersions);

// Computed property for production check
const isProduction = computed<boolean>(() => {
  // Version toggling is only enabled for production and not lower environment.
  return new URL(window.location.origin)?.host === 'materialsmine.org';
  // return new URL(window.location.origin)?.host === 'localhost';
});

// Methods
const toggleDialogBox = (): void => {
  store.commit('setDialogBox');
};

const resetDeploymentStatus = (): void => {
  store.commit('portal/resetDeploymentStatus');
};

const closeDialogBox = (): void => {
  toggleDialogBox();
  resetDeploymentStatus();
};

const setVersion = (e: Event): void => {
  const target = e.target as HTMLSelectElement;
  store.commit('portal/setCurrentVersion', target.value);
};

const fetchVersions = (): void => {
  store.dispatch('portal/fetchVersions');
};

const deploy = (type: string): void => {
  store.dispatch('portal/deploy', type);
};

// Watchers
watch(dialogBoxActive, (newValue) => {
  if (newValue === false) {
    resetDeploymentStatus();
  }
});

// Lifecycle hooks
onMounted(() => {
  if (isProduction.value) {
    fetchVersions();
  }
  store.commit('setAppHeaderInfo', {
    icon: '',
    name: 'General Deployment'
  });
});
</script>
