<template>
	<div>
		<div class="section_teams">
            <div>
                <div>
                    <md-button
                        class="md-icon-button"
                        @click.native.prevent="navBack"
                    >
                        <md-tooltip md-direction="bottom">
                        Go Back
                        </md-tooltip>
                    <md-icon>arrow_back</md-icon>
                    </md-button>
                    <router-link to="/explorer/curate" v-slot="{navigate, href}" custom>
                        <a :href="href" @click="navigate">
                        <md-tooltip md-direction="bottom">
                        Curate Home
                        </md-tooltip>
                        Curate
                        </a>
                    </router-link>
                    <span class="md-icon-button"> > </span>
                    <span
                        class="md-icon-button"
                    >
                        New
                    </span>
                </div>
            </div>
			<div class="curate">
				<div>
                    <h2 class="visualize_header-h1">Select Curation Method</h2>
                    <div class="md-layout md-layout-responsive">
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/curate/new/spreadsheet" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">upload_file</md-icon>
                                    <span class="explorer_page-nav-card_text">Upload a spreadsheet</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Upload filled template spreadsheet to prefill form and validate input.
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/curate/new/stepper" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">edit_note</md-icon>
                                    <span class="explorer_page-nav-card_text">Fill a form</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Follow a stepper model to fill form and validate input.
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/curate/new/sdd" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">done_outline</md-icon>
                                    <span class="explorer_page-nav-card_text">Submit with SDD</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Submit files that use a semantic data dictionary (SDD).
                                    </p>
                                </div>
                            </router-link>
                        </div>
                    </div>
                </div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
  name: 'CurateHome',
  methods: {
    navBack () {
      this.$router.back()
    }
  }
}
</script>
