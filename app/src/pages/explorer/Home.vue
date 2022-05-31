<template>
	<div>
		<!-- <facet-panel :searchEnabled="searchEnabled" class="facet_panel" /> -->
		<facet-panel class="facet_panel" />
		<div class="section_teams" v-if="!searchEnabled">
			<div class="search_box">
				<h2 class="search_box_header">Welcome to MM Explorer</h2>
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
					<ul class="search-dropdown-menu" style="width:100%">
						<li v-for="(suggestion, index) in suggestions" :key="index" class="" @click.prevent="submitSearch(suggestion)">
							<a href="#">{{ suggestion }}</a>
						</li>
					</ul>
				</div>
				<router-link class="search_box_link" :to="{name:'ParameterizedQuery'}">Search using a Parameterized Query</router-link>
				<p class="search_box_text">
					MM Explorer is a research-focused discovery tool that enables collaboration among scholars of nano and meta materials. Browse or search information on articles, samples, images, charts, etc.
				</p>
			</div>
		</div>
		<div class="explorer_page-container" v-if="!searchEnabled">
			<div class="explorer_page-nav">
				<div class="teams_list explorer_page-list">
					<ul class="utility_flex_mobile">
						<li v-for="link in pageNavLinks" :key="link.text">
							<router-link :to="'/' + link.link" v-slot="{navigate, href}" custom>
								<div class="teams_container explorer_page-nav-card" :href="href" @click="navigate">
									<md-icon class="explorer_page-nav-card_icon">{{ link.icon }}</md-icon>
									<span class="explorer_page-nav-card_text">{{ link.text }}</span>
								</div>
							</router-link>
						</li>
					</ul>
				</div>
			</div>
		</div>
		<search-header v-if="searchEnabled"/>
		<search-results-table v-if="searchEnabled"/>
		<div class="explorer_page_footer">
			<span class="explorer_page_footer-text">&copy; 2022 MaterialsMine Project</span>
		</div>
	</div>
</template>

<script>
import explorerSearch from '@/mixins/explorerSearch'
import FacetPanel from '@/components/explorer/Facet.vue'
import SearchHeader from '@/components/explorer/SearchHeader.vue'
import SearchResultsTable from '@/components/explorer/SearchResultsTable.vue'

export default {
  name: 'ExplorerHome',
  mixins: [explorerSearch],
  data () {
    return {
      pageNavLinks: [
        { icon: 'grid_view', text: 'Gallery', link: 'explorer/visualization' },
        { icon: 'cloud_upload', text: 'Curate', link: 'explorer/create' },
        { icon: 'help', text: 'Help', link: 'nm/how' }
      ]
    }
  },
  components: {
    FacetPanel,
    SearchHeader,
    SearchResultsTable
  },
  async mounted () {
    await this.$store.dispatch('explorer/facetFilterMaterials')
  }
}
</script>
