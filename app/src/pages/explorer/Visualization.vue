<template>
	<div>
		<div class="section_teams">
			<div class="search_box">
				<h2 class="search_box_header u_margin-bottom-big">Gallery Categories:</h2>
                <div class="md-layout md-gutter">
                    <div class="md-layout-item">&nbsp;</div>
                    <div class="md-layout-item">
                        <router-link to="/explorer/chart" v-slot="{navigate, href}" custom>
                            <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                <md-icon class="explorer_page-nav-card_icon">ssid_chart</md-icon>
                                <span class="explorer_page-nav-card_text">Charts</span>
                                <p class="md-layout-item_para">Our chart builder leverages SPARQL and Vega-Lite for rich, 
                                    interactive charts of data from the MaterialsMine knowledge graph. Visit our Charts Gallery to view examples, 
                                    and contact us to get your data integrated.
                                </p>
                            </div>
                        </router-link>
                    </div>
                    <div class="md-layout-item">
                        <router-link to="/explorer/images" v-slot="{navigate, href}" custom>
                            <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                <md-icon class="explorer_page-nav-card_icon">grid_view</md-icon>
                                <span class="explorer_page-nav-card_text">Image</span>
                                <p class="md-layout-item_para">Visit our Image Gallery to view microstructural images for nanocomposite systems stored 
                                    in the MaterialsMine knowledge graph, and filter by material constituents, nanoparticle geometry, and more..
                                </p>
                            </div>
                        </router-link>
                    </div>
                    <div class="md-layout-item">&nbsp;</div>
                </div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
  name: 'VisualizationHome',
}
</script>
