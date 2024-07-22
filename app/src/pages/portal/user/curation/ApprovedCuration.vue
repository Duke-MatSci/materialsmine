<template>
  <div
    class="gallery-grid grid grid_col-3 u--margin-toplg"
    style="width: 65vw !important"
  >
    <template v-if="xmlFinder.xmlData && xmlFinder.xmlData.length && !error">
      <md-card
        v-for="(xml, index) in xmlFinder.xmlData"
        :key="index"
        class="btn--animated gallery-item"
      >
        <div class="u_gridicon">
          <div
            v-if="isOwner(xml.user)"
            @click.prevent="editCuration(xml.id, xml.isNewCuration)"
          >
            <md-tooltip md-direction="top">Edit Curation</md-tooltip>
            <md-icon>edit</md-icon>
          </div>
          <div
            v-if="isOwner(xml.user)"
            @click.prevent="openDialogBox(xml.id, xml.isNewCuration)"
          >
            <md-tooltip md-direction="top">Delete Curation</md-tooltip>
            <md-icon>delete</md-icon>
          </div>
        </div>
        <router-link
          :to="{
            name: 'XmlVisualizer',
            params: { id: xml.id },
            query: { isNewCuration: xml.isNewCuration }
          }"
        >
          <md-card-media-cover md-solid>
            <md-card-media md-ratio="4:3">
              <md-icon class="explorer_page-nav-card_icon u_margin-top-small"
                >code_off</md-icon
              >
            </md-card-media>
            <md-card-area class="u_gridbg">
              <md-card-header class="u_show_hide">
                <span class="md-subheading">
                  <strong>{{ xml.title || xml.id || '' }}</strong>
                </span>
                <span class="md-body-1">Click to view</span>
              </md-card-header>
            </md-card-area>
          </md-card-media-cover>
        </router-link>
      </md-card>
    </template>
    <template v-else>
      <div
        class="utility-roverflow u_centralize_text u_margin-top-med section_loader"
      >
        <!-- <div class="u_display-flex spinner"></div> -->
        <h1 class="visualize_header-h1 u_margin-top-med">
          No Approved XMLs...
        </h1>
      </div>
    </template>

    <dialog-box v-if="dialogBoxActive" :minWidth="40" :active="dialogBoxActive">
      <template v-slot:title>Delete Curation</template>
      <template v-slot:content
        >Are you sure? This action would permanently remove this curation from
        our server.</template
      >
      <template v-slot:actions>
        <md-button @click.native.prevent="closeDialogBox">Cancel</md-button>
        <md-button @click.native.prevent="confirmAction">Delete</md-button>
      </template>
    </dialog-box>
  </div>
</template>
<script>
import xmlOperation from '@/mixins/xmlOperation'

export default {
  name: 'ApprovedCuration',
  mixins: [xmlOperation],
  created () {
    this.$store.commit('setAppHeaderInfo', {
      icon: '',
      name: 'Approved Curation'
    })
  }
}
</script>
