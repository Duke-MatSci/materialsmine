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
        <div style="text-align:right"> Query "{{searchWord}}" found {{totalResults}} results </div>
        </md-card>
        <md-tabs class="btn--primary">
            <md-tab :md-label="'Articles (' + totalArticles + ')'" @click="setResultsTab('Articles')"></md-tab>
            <md-tab :md-label="'Samples (' + totalSamples + ')'" @click="setResultsTab('Samples')"></md-tab>
            <md-tab :md-label="'Images (' + totalImages + ')'" @click="setResultsTab('Images')"></md-tab>
            <md-tab :md-label="'Charts (' + totalCharts + ')'" @click="setResultsTab('Charts')"></md-tab>
            <md-tab :md-label="'Materials (' + totalMaterials + ')'" @click="setResultsTab('Materials')"></md-tab>
            <!-- <md-tab :md-label="'Other (' + other + ')'" @click="setResultsTab('Other')"></md-tab> -->
        </md-tabs>
    </div>
</template>
<script>
import { mapMutations, mapGetters } from 'vuex'
export default {
  name: 'SearchHeader',
  props: ['searchEnabled'],
  computed: {
    ...mapGetters('explorer/results', ['articles', 'samples', 'images', 'charts', 'materials']),
    searchWord: {
      get () {
        return this.$store.getters['explorer/getSearchKeyword']
      },
      set (payload) {
        return this.$store.commit('explorer/setSearchKeyword', payload)
      }
    },
    totalArticles () {
      return (this.articles ? this.articles.length : 0)
    },
    totalSamples () {
      return (this.samples ? this.samples.length : 0)
    },
    totalImages () {
      return (this.images ? this.images.length : 0)
    },
    totalCharts () {
      return (this.charts ? this.charts.length : 0)
    },
    totalMaterials () {
      return (this.materials ? this.materials.length : 0)
    },
    totalResults () {
      return (this.totalArticles + this.totalSamples + this.totalImages + this.totalCharts + this.totalMaterials)
    }
    // other () {
    //   return 0
    // }
  },
  methods: {
    ...mapMutations('explorer', ['setResultsTab'])
  }
}
</script>
