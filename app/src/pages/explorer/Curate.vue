<template>
	<div>
		<div class="section_teams">
			<div class="curate">
				<div>
                    <h2 class="visualize_header-h1 visualize_header-h1-curate">Curate</h2>
                    <div class="u_divider-fullspan"></div>
                    <div class="md-layout md-layout-responsive">
                        <!-- <div class="md-layout-item">&nbsp;</div> -->
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/chart" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">upload_file</md-icon>
                                    <span class="explorer_page-nav-card_text">Upload a spreadsheet</span>
                                    <p class="md-layout-item_para">Upload spreadsheet to prefill form and validate input. Upload spreadsheet to
                                        prefill form and validate input.
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/images" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">edit_note</md-icon>
                                    <span class="explorer_page-nav-card_text">Fill a form</span>
                                    <p class="md-layout-item_para">You can follow your stepper model here to fill form and validate input. Upload
                                        spreadsheet to prefill form and validate input.
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/images" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">done_outline</md-icon>
                                    <span class="explorer_page-nav-card_text">Submit SDD</span>
                                    <p class="md-layout-item_para">Submit your SDD to prefill form and validate input. Upload spreadsheet
                                        to prefill form and validate input.
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <!-- <div class="md-layout-item">&nbsp;</div> -->
                    </div>
                </div>
                <div>
                    <h2 class="visualize_header-h1 visualize_header-h1-curate">Create Visualization</h2>
                    <div class="u_divider-fullspan"></div>
                    <div class="md-layout md-layout-responsive">
                        <!-- <div class="md-layout-item">&nbsp;</div> -->
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/chart" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">ssid_chart</md-icon>
                                    <span class="explorer_page-nav-card_text">Create new chart</span>
                                    <p class="md-layout-item_para">Create a new visualization of chart and validate input. Upload spreadsheet to
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