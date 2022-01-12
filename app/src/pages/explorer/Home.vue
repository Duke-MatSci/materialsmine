<template>
	<div class="page-container">
		<md-app md-waterfall md-mode="fixed-last">
			<md-app-toolbar :toggler='toggleMenu' />
			<md-app-drawer :md-active.sync="menuVisible">
				<drawer />
			</md-app-drawer>

			<md-app-content>
				<div class="section_teams">
					<div class="search_box">
						<h2 class="search_box_header">Welcome to MM Explorer</h2>
						<form class="form">
							<div class="search_box_form">
								<div class="form__group search_box_form-item-1">
										<input type="text" class="form__input form__input--adjust" placeholder="Search" name="search" id="search" required />
										<label htmlFor="search" class="form__label search_box_form_label">Search</label>
								</div>
								<div class="form__group search_box_form-item-2">
									<button type="submit" class="btn btn--primary btn--noradius search_box_form_btn">Search</button>
								</div>
							</div>
						</form>
						<p class="search_box_text">
							MM Explorer is a research-focused discovery tool that enables collaboration among scholars of nano and meta materials. Browse or search information on publication, images, charts, etc.
						</p>
					</div>
					<!-- <div class="explorer_page-nav">
						<div class="explorer_page-nav-item"><md-content class="md-elevation-3 explorer_page-nav-item-card">3</md-content></div>
						<div class="explorer_page-nav-item"><md-content class="md-elevation-3 explorer_page-nav-item-card">3</md-content></div>
						<div class="explorer_page-nav-item"><md-content class="md-elevation-3 explorer_page-nav-item-card">3</md-content></div>
						<div class="explorer_page-nav-item"><md-content class="md-elevation-3 explorer_page-nav-item-card">3</md-content></div>
						<div class="explorer_page-nav-item"><md-content class="md-elevation-3 explorer_page-nav-item-card">3</md-content></div>
						<div class="explorer_page-nav-item"><md-content class="md-elevation-3 explorer_page-nav-item-card">3</md-content></div>
					</div> -->
				</div>
			</md-app-content>
		</md-app>
	</div>
</template>


<script>
import ExpHeader from '@/components/baseUI/explorer/Header.vue'
import Drawer from '@/components/baseUI/explorer/Drawer.vue'
export default {
	name: 'ExplorerHome',
	components: {
		mdAppToolbar: ExpHeader,
		Drawer
	},
	data () {
		return {
			menuVisible: false
		}
	},
	methods: {
    toggleMenu () {
      return this.menuVisible = !this.menuVisible
    }
  },
}
</script>