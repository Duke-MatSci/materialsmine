<template>
  <div class="section_teams">
    <CurateNavBar active="Spreadsheet" :navRoutes="navRoutes" />

    <div class="curate">
      <div>
        <h2 class="visualize_header-h1">Spreadsheet</h2>

        <div class="md-layout md-gutter utility_flex_mobile">
          <div class="md-layout u_display-flex md-layout-responsive">
            <!-- Single Sample Upload -->
            <div class="md-layout-item">
              <div
                class="teams_container explorer_page-nav-card md-layout-item_card"
                @click="createDatasetIdVuex"
              >
                <md-icon class="explorer_page-nav-card_icon">note_add</md-icon>
                <span class="explorer_page-nav-card_text"> Single Sample Upload </span>
                <p class="md-layout-item_para md-layout-item_para_fl">
                  Create a new dataset using the XML template for a single sample.
                </p>
              </div>
            </div>

            <!-- Bulk Upload -->
            <div class="md-layout-item u_height--auto">
              <router-link to="/explorer/curate/bulk" v-slot="{ navigate, href }" custom>
                <div
                  class="teams_container explorer_page-nav-card md-layout-item_card"
                  :href="href"
                  @click="navigate"
                >
                  <md-icon class="explorer_page-nav-card_icon">folder_zip</md-icon>
                  <span class="explorer_page-nav-card_text">Bulk Upload</span>
                  <p class="md-layout-item_para md-layout-item_para_fl">
                    Create a new dataset from a .zip file of multiple samples.
                  </p>
                </div>
              </router-link>
            </div>

            <!-- Edit Existing -->
            <div class="md-layout-item u_height--auto md-gutter utility_flex_mobile">
              <router-link to="/explorer/curate/edit" v-slot="{ navigate, href }" custom>
                <div
                  class="teams_container explorer_page-nav-card md-layout-item_card"
                  :href="href"
                  @click="navigate"
                >
                  <md-icon class="explorer_page-nav-card_icon">edit_document</md-icon>
                  <span class="explorer_page-nav-card_text">Edit existing</span>
                  <p class="md-layout-item_para md-layout-item_para_fl">
                    Select and edit a dataset that has already been curated.
                  </p>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { useStore } from 'vuex';
import CurateNavBar from '@/components/curate/CurateNavBar.vue';
// store instance
const store = useStore();
// navigation routes state
const navRoutes = reactive([
  {
    label: 'Curate',
    path: '/explorer/curate',
  },
]);
// method to trigger Vuex action
const createDatasetIdVuex = () => {
  store.dispatch('explorer/curation/createDatasetIdVuex', { isBulk: false });
};
</script>
