<template>
    <div class="explorer_page_header">
        <md-card style="padding:2rem; margin:2rem; z-index: 10">
        <form class="form" @submit.prevent="submitSearch">
          <div class="search_box_form">
              <div class="form__group search_box_form-item-1">
                  <input type="text" ref="search_input" class="form__input form__input--adjust" placeholder="Search" name="search" id="search" required v-model="searchWord" />
                  <label htmlFor="search" class="form__label search_box_form_label">Search</label>
              </div>
              <div class="form__group search_box_form-item-2">
                  <button type="submit" class="btn btn--primary btn--noradius search_box_form_btn">Search</button>
              </div>
          </div>
        </form>
        <div class="search-dropdown-menu_parent" v-if="!!suggestions.length">
					<ul class="search-dropdown-menu">
						<li v-for="(suggestion, index) in suggestions" :key="index" class="" @click.prevent="submitSearch(suggestion)">
							<a href="#">{{ suggestion }}</a>
						</li>
					</ul>
				</div>
        <div style="text-align:right" v-if="getTotal > 1"><strong>{{getTotal}}</strong> results for "{{searchWord}}" </div>
        <div style="text-align:right" v-else>Found {{getTotal}} result for query "{{searchWord}}" </div>
        </md-card>
        <md-tabs class="btn--primary">
            <md-tab :md-label="'Articles (' + passTotal.getArticles + ')'" @click.prevent="setResultsTabs('getArticles')"></md-tab>
            <md-tab :md-label="'Samples (' + passTotal.getSamples + ')'" @click.prevent="setResultsTabs('getSamples')"></md-tab>
            <md-tab :md-label="'Images (' + imageTotal + ')'" @click.prevent="setResultsTabs('getImages')"></md-tab>
            <md-tab :md-label="'Charts (' + passTotal.getCharts + ')'" @click.prevent="setResultsTabs('getCharts')"></md-tab>
            <md-tab :md-label="'Properties (' + passTotal.getMaterials + ')'" @click.prevent="setResultsTabs('getMaterials')"></md-tab>
        </md-tabs>
    </div>
</template>
<script>
import { mapGetters } from 'vuex'
import explorerSearch from '@/mixins/explorerSearch'
export default {
  name: 'SearchHeader',
  mixins: [explorerSearch],
  computed: {
    ...mapGetters({
      resultsTab: 'explorer/getResultsTab',
      passTotal: 'explorer/results/getTotalGroupings',
      getTotal: 'explorer/results/getTotal'
    }),
    imageTotal () {
      return this.passTotal?.getImages ?? 0
    }
  },
  methods: {
    setResultsTabs (payload) {
      return this.setResultsTab(payload)
    }
  }
}
</script>
