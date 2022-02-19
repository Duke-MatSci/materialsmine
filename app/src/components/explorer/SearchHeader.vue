<template>
    <div class="explorer_page_header">
        <md-card style="padding:2rem; margin:2rem;">
        <div class="search_box_form">
            <div class="form__group search_box_form-item-1">
                <input type="text" ref="search_input" class="form__input form__input--adjust" placeholder="Search" name="search" id="search" required v-model="searchWord" />
                <label htmlFor="search" class="form__label search_box_form_label">Search</label>
            </div>
            <div class="form__group search_box_form-item-2">
                <button type="submit" class="btn btn--primary btn--noradius search_box_form_btn">Search</button>
            </div>
        </div>
        <div style="text-align:right"> Query "{{searchWord}}" found 12345 results </div>
        </md-card>
        <md-tabs class="btn--primary">
            <md-tab :md-label="'Articles (' + articles + ')'" @click="setResultsTab('Articles')"></md-tab>
            <md-tab :md-label="'Samples (' + samples + ')'" @click="setResultsTab('Samples')"></md-tab>
            <md-tab :md-label="'Images (' + images + ')'" @click="setResultsTab('Images')"></md-tab>
            <md-tab :md-label="'Charts (' + charts + ')'" @click="setResultsTab('Charts')"></md-tab>
            <md-tab :md-label="'Materials (' + materials + ')'" @click="setResultsTab('Materials')"></md-tab>
            <!-- <md-tab :md-label="'Other (' + other + ')'" @click="setResultsTab('Other')"></md-tab> -->
        </md-tabs>
    </div>
</template>
<script>
import { mapMutations } from 'vuex'
export default {
  name: 'SearchHeader',
  props: ['searchEnabled'],
  computed: {
    searchWord: {
      get () {
        return this.$store.getters['explorer/getSearchKeyword']
      },
      set (payload) {
        return this.$store.commit('explorer/setSearchKeyword', payload)
      }
    },
    images () {
      return 0
    },
    samples () {
      return 0
    },
    articles () {
      return 0
    },
    charts () {
      return 0
    },
    materials () {
      return 0
    }
    // other () {
    //   return 0
    // }
  },
  methods: {
    ...mapMutations( 'explorer', ['setResultsTab']),
  }
}
</script>
