<template>
	<div>
		<div class="section_teams">
			<div class="curate">
				<div>
                    <h2 class="visualize_header-h1">Curate</h2>
                    <div class="md-layout md-layout-responsive">
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/curate/spreadsheet" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">upload_file</md-icon>
                                    <span class="explorer_page-nav-card_text">Upload a spreadsheet</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Upload filled template spreadsheet for XML conversion.</p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">workspaces</md-icon>
                                    <span class="explorer_page-nav-card_text">Fill a form</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">
                                        Use this step-by-step model for curating data instead of using a spreadsheet template.
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">done_outline</md-icon>
                                    <span class="explorer_page-nav-card_text">Submit with SDD</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Submit files that use a semantic data dictionary (SDD).
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <!-- Extra Div causes misalignment and has no known use -->
                         <!-- <div class="md-layout-item md-layout-item_card">
                        </div> -->
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
                    <h2 class="visualize_header-h1 metamine_footer-ref-header">Valid Curation List Entry</h2>

                    <div class="md-layout md-layout-responsive">
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/curate/validList/all" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">manage_search</md-icon>
                                    <span class="explorer_page-nav-card_text">View all entries</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">View and search a list of all valid curation items entered so far.</p>
                                </div>
                            </router-link>
                        </div>

                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/curate/validList" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">note_add</md-icon>
                                    <span class="explorer_page-nav-card_text">Enter new list</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Input valid items from the available lists in the curation template spreadsheet.</p>
                                </div>
                            </router-link>
                        </div>

                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/curate/validList/update" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">edit_note</md-icon>
                                    <span class="explorer_page-nav-card_text">Update list entry</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Update the existing list of valid entries in the system.</p>
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
