<template>
<div class="section_teams">
    <md-button class="md-button-lightbg" @click="callSnackbar1">Click here for snackbar 1</md-button>
    <md-button class="md-button-lightbg" @click="callSnackbar2">Click here for snackbar 2</md-button>
    <CurateNavBar active="Spreadsheet" :navRoutes="navRoutes"/>
    <div class="curate">
        <div>
            <h2 class="visualize_header-h1">Spreadsheet</h2>
            <div class="md-layout md-gutter utility_flex_mobile">
                <div class="md-layout md-layout-responsive md-gutter">
                    <div class="md-layout-item md-small-hide">&nbsp;</div>
                    <div class="md-layout-item">
                        <div class="teams_container explorer_page-nav-card md-layout-item_card" @click="createDatsetIdVuex()">
                                <md-icon class="explorer_page-nav-card_icon">note_add</md-icon>
                                <span class="explorer_page-nav-card_text">Create new</span>
                                <p class="md-layout-item_para md-layout-item_para_fl">
                                    Choose a curation method and create a new dataset from scratch.
                                </p>
                            </div>
                    </div>
                    <div class="md-layout-item md-gutter utility_flex_mobile">
                        <router-link to="/explorer/curate/edit" v-slot="{navigate, href}" custom>
                            <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                <md-icon class="explorer_page-nav-card_icon">edit_document</md-icon>
                                <span class="explorer_page-nav-card_text">Edit existing</span>
                                <p class="md-layout-item_para md-layout-item_para_fl">
                                    Select and edit a dataset that has already been curated.
                                </p>
                            </div>
                        </router-link>
                    </div>
                    <div class="md-layout-item  md-small-hide">&nbsp;</div>
                </div>
            </div>
        </div>
    </div>
    <snackbar1 :active="snackbarActive">
      <template v-slot:content>
        This snackbar passes props and uses slots
      </template>
    </snackbar1>
    <snackbar2/>
</div>
</template>

<script>
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
import SnackbarProps from '@/components/SnackbarPropsSlot.vue'
import SnackbarVuex from '@/components/SnackbarWatchVuex.vue'
import { mapActions } from 'vuex'
import { mapGetters, mapMutations } from 'vuex'

export default {
  name: 'SpreadsheetBase',
  components: {
    CurateNavBar,
    snackbar1: SnackbarProps,
    snackbar2: SnackbarVuex
  },
  computed: {
    ...mapGetters({
      //used for snackbar 1
      snackbarActive: 'snackbar'
    })
  },
  data () {
    return {
      navRoutes: [
        {
          label: 'Curate',
          path: '/explorer/curate'
        }
      ]
    }
  },
  methods: {
    ...mapActions('explorer/curation', ['createDatsetIdVuex']),
    ...mapMutations({
      //used for snackbar 1
      callSnackbar1: 'setSnackbar',
      //used for snackbar 2
      setSnackMsg: 'setSnackMsg'
    }),
    callSnackbar2 () {
      this.setSnackMsg('This snackbar uses computed properties and watches Vuex')
    }
  }
}
</script>
