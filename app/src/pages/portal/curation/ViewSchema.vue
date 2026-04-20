<template>
  <div>
    <div class="viz-u-mgup-sm utility-margin md-theme-default">
      <div class="md-card-header contactus_radios md-card-header-flex">
        <div class="md-card-header-text">
          <div class="md-layout-item_para_fl u--color-grey wrapper--medium">
            You can view and download your schema here.
          </div>
        </div>
      </div>

      <md-divider class="u_margin-top-small u_margin-bottom-med"></md-divider>

      <template>
        <div class="utility-roverflow">
          <div class="gallery-grid grid grid_col-2 grid_col-2-responsive">
            <div class="gallery-item">
              <div
                class="md-layout md-layout-item md-layout-item_card u_margin-none"
              >
                <router-link
                  to="/xsd/xsd-view"
                  class="explorer_page-nav-card teams_container u--margin-rightml u--margin-none utility-roverflow u--shadow-none"
                >
                  <i
                    class="md-icon md-icon-font explorer_page-nav-card_icon md-theme-default card-icon-adjust u--margin-topxl"
                    >code</i
                  >
                  <span
                    class="explorer_page-nav-card_text viz-sample__loading u_margin-top-small"
                    >View XSD schema</span
                  >
                  <p class="md-layout-item_para u--font-emph-sl">
                    View your schema in a json format directly from the web.
                  </p>
                </router-link>
              </div>
            </div>
            <div class="gallery-item" @click="handleDownloadJsonSchema">
              <div class="md-layout md-layout-item_card u_margin-none">
                <div
                  class="explorer_page-nav-card teams_container u--margin-rightml u--margin-none u--shadow-none"
                >
                  <i
                    class="md-icon md-icon-font explorer_page-nav-card_icon md-theme-default card-icon-adjust u--margin-topxl"
                    >download</i
                  >
                  <span
                    class="explorer_page-nav-card_text viz-sample__loading u_margin-top-med"
                    >Download schema</span
                  >
                  <p class="md-layout-item_para u--font-emph-sl">
                    Download your schema in a XSD format to your local machine.
                  </p>
                </div>
              </div>
            </div>
            <div class="gallery-item" @click="handlePublishSchema">
              <div
                class="md-layout md-layout-item md-layout-item_card u_margin-none"
              >
                <div
                  class="explorer_page-nav-card teams_container u--margin-rightml u--margin-none u--shadow-none"
                >
                  <i
                    class="md-icon md-icon-font explorer_page-nav-card_icon md-theme-default card-icon-adjust u--margin-topxl"
                    >publish</i
                  >
                  <span
                    class="explorer_page-nav-card_text viz-sample__loading u_margin-top-med"
                    >Publish schema</span
                  >
                  <p class="md-layout-item_para u--font-emph-sl">
                    Publish your schema in an XSD format
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

// Store
const store = useStore();

// Computed
const token = computed(() => store.getters['auth/token']);

// Methods
const handleDownloadJsonSchema = async () => {
  await store.dispatch('portal/downloadJsonSchema');
};

const handlePublishSchema = async () => {
  await store.dispatch('portal/publishSchema');
};

// Lifecycle
onMounted(() => {
  store.commit('setAppHeaderInfo', { icon: '', name: 'View Schema' });
});
</script>
