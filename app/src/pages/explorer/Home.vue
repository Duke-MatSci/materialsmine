<template>
	<div>
		<md-app md-waterfall md-mode="fixed-last">
			<md-app-toolbar :toggler='toggleMenu' />
			<md-app-drawer :md-active.sync="toggleMenuVisibility">
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
				</div>
				<div class="explorer_page-container">
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
			</md-app-content>
		</md-app>
	</div>
</template>

<script>
import ExpHeader from '@/components/explorer/Header.vue'
import Drawer from '@/components/explorer/Drawer.vue'
export default {
  name: 'ExplorerHome',
  components: {
    mdAppToolbar: ExpHeader,
    Drawer
  },
  data () {
    return {
      toggleMenuVisibility: false,
      pageNavLinks: [
        { icon: 'grid_view', text: 'Gallery', link: '' },
        { icon: 'cloud_upload', text: 'Curate', link: '' },
        { icon: 'help', text: 'Help', link: '' }
      ]
    }
  },
  methods: {
    toggleMenu () {
      this.toggleMenuVisibility = !this.toggleMenuVisibility
    }
  }
}
</script>
