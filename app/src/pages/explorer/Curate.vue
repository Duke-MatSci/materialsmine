<template>
	<div>
		<div class="section_teams">
			<div class="curate">
				<div>
                    <h2 class="visualize_header-h1">Curate</h2>
                    <div class="md-layout md-layout-responsive">
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">note_add</md-icon>
                                    <span class="explorer_page-nav-card_text">Create new</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">
                                        Choose a curation method and create a new dataset from scratch.
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
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
                         <div class="md-layout-item md-layout-item_card">
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">article</md-icon>
                                    <span class="explorer_page-nav-card_text">Submit FEA Templates</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor magna aliqua.
                                    </p>
                                </div>
                            </router-link>
                        </div>
                    </div>
                </div>
                <div class="u_margin-top-med">
                    <h2 class="visualize_header-h1 metamine_footer-ref-header">Create Visualization</h2>
                    <div class="md-layout md-layout-responsive">
                        <!-- <div class="md-layout-item">&nbsp;</div> -->
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/chart" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">ssid_chart</md-icon>
                                    <span class="explorer_page-nav-card_text">Create new chart</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Create a new visualization of chart and validate input. Upload spreadsheet to
                                        prefill form and validate input.
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item">&nbsp;</div>
                    </div>
                </div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
  name: 'CurateHome'
}
</script>
