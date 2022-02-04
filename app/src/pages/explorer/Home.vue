<template>
	<div>
		<facet-panel :searchEnabled="searchEnabled" />
		<div class="section_teams" v-if="!searchEnabled">
			<div class="search_box">
				<h2 class="search_box_header">Welcome to MM Explorer</h2>
				<form class="form" @submit.prevent="setSearching">
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
				<p class="search_box_text">
					MM Explorer is a research-focused discovery tool that enables collaboration among scholars of nano and meta materials. Browse or search information on articles, samples, images, charts, etc.
				</p>
			</div>
		</div>
		<div class="explorer_page-container" v-if="!searchEnabled">
			<div class="explorer_page-nav">
				<div class="teams_list explorer_page-list">
					<ul>
						<li v-for="link in pageNavLinks" :key="link.text">
							<div class="teams_container explorer_page-nav-card">
								<md-icon class="explorer_page-nav-card_icon">{{ link.icon }}</md-icon>
								<span class="explorer_page-nav-card_text">{{ link.text }}</span>
							</div>
						</li>
					</ul>
				</div>
			</div>
		</div>
		<div class="explorer_page_footer">
			<span class="explorer_page_footer-text">&copy; 2022 MaterialsMine Project</span>
		</div>
	</div>
</template>

<script>
import { mapMutations } from 'vuex'
import FacetPanel from '@/components/explorer/Facet.vue'
export default {
	name: 'ExplorerHome',
	data () {
		return {
			pageNavLinks: [
				{ icon: 'grid_view', text: 'Gallery', link: '' },
				{ icon: 'cloud_upload', text: 'Curate', link: '' },
				{ icon: 'help', text: 'Help', link: '' }
			],
		}
	},
	computed: {
		searchWord: {
			get(){
				return this.$store.getters['explorer/getSearchKeyword']
			},
			set (payload) {
				return this.$store.commit('explorer/setSearchKeyword', payload)
			}
		},
		searchEnabled(){
			return this.$store.getters['explorer/getSearching']
		}
	},
	components: {
		FacetPanel
	},
	methods: {
		...mapMutations('explorer', ['setSearching'])
	}
}
</script>
