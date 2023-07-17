<template>
	<div>
		<div class="section_teams">
			<div class="curate">
				<div>
                    <h2 class="visualize_header-h1">Tools</h2>
                    <div class="md-layout u_display-flex md-layout-responsive">
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="/explorer/tools/dynamfit" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">stacked_line_chart</md-icon>
                                    <span class="explorer_page-nav-card_text">DynamFit</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description here about what DynamFit does.</p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">manage_search</md-icon>
                                    <span class="explorer_page-nav-card_text">ChemProps</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description of ChemProps.</p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                                <div class="teams_container explorer_page-nav-card md-layout-item_card">
                                    <md-icon class="explorer_page-nav-card_icon">grain</md-icon>
                                    <span class="explorer_page-nav-card_text" style="text-align: center">Polymerizer</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description of Polymerizer.</p>
                                </div>
                        </div>
                    </div>
                </div>
                <div class="u_margin-top-med">
                <accordion :startOpen="false" :customTitle="true" :title="'Image Binarization'">
                    <template #custom_title> 
                        <h2 class="visualize_header-h1" style="margin-bottom:0;">Image Binarization</h2>
                    </template>
                  <div class="u_margin-top-small">
                    <div> Binarization is the process of converting a micrograph to a black and white 
                        image (assuming there are only 2 phases) by removing noise and thus simplifying 
                        its analysis.
                    </div>
                    <div class="u_margin-bottom-small"> All 'Characterization and Reconstruction' algorithms work with binarized images only.</div>
                    <div class="md-layout u_display-flex md-layout-responsive u_margin-top-med">
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">compare</md-icon>
                                    <span class="explorer_page-nav-card_text">Otsu's Method</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl"> Works well for relatively 
                                        noise free images having significant contrast between filler and matrix material.</p>
                                </div>
                            </router-link>
                        </div>

                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">compare</md-icon>
                                    <span class="explorer_page-nav-card_text">Niblack's Method</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">
                                        Works well for gray-level images with low contrast between filler and matrix material.
                                    </p>
                                </div>
                            </router-link>
                        </div>
                    </div>
                  </div>
                </accordion>
                </div>
                <div class="u_margin-top-med">
                <accordion :startOpen="false" :customTitle="true" :title="'Microstructure Characterization'">
                    <template #custom_title> 
                        <h2 class="visualize_header-h1" style="margin-bottom:0;">Microstructure Characterization</h2>
                    </template>
                    <div class="md-layout u_display-flex md-layout-responsive u_margin-top-med">
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">image_search</md-icon>
                                    <span class="explorer_page-nav-card_text" style="text-align: center">Intelligent Characterization</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description of Intelligent Characterization.</p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">ssid_chart</md-icon>
                                    <span class="explorer_page-nav-card_text">Correlation Functions</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description of Correlation Functions
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">ssid_chart</md-icon>
                                    <span class="explorer_page-nav-card_text">Physical Descriptors</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description of Physical Descriptors
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">ssid_chart</md-icon>
                                    <span class="explorer_page-nav-card_text">Spectral Density</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description of Spectral Density Function
                                    </p>
                                </div>
                            </router-link>
                        </div>
                    </div>
                </accordion>
                </div>
                <div class="u_margin-top-med">
                    <accordion :startOpen="false" :customTitle="true" :title="'Microstructure Reconstruction'">
                    <template #custom_title> 
                        <h2 class="visualize_header-h1" style="margin-bottom:0;">Microstructure Reconstruction</h2>
                    </template>
                    <div class="md-layout u_display-flex md-layout-responsive u_margin-top-med">
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">ssid_chart</md-icon>
                                    <span class="explorer_page-nav-card_text">Correlation Functions</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description of Correlation Functions
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">ssid_chart</md-icon>
                                    <span class="explorer_page-nav-card_text">Physical Descriptors</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description of Physical Descriptors
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">ssid_chart</md-icon>
                                    <span class="explorer_page-nav-card_text">Spectral Density</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description of Spectral Density Function
                                    </p>
                                </div>
                            </router-link>
                        </div>
                        <div class="md-layout-item md-layout-item_card">
                            <router-link to="" v-slot="{navigate, href}" custom>
                                <div class="teams_container explorer_page-nav-card md-layout-item_card" :href="href" @click="navigate">
                                    <md-icon class="explorer_page-nav-card_icon">ssid_chart</md-icon>
                                    <span class="explorer_page-nav-card_text">Transfer Learning</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description of Transfer Learning
                                    </p>
                                </div>
                            </router-link>
                        </div>
                    </div>
                    </accordion>
                </div>
			</div>
		</div>
	</div>
</template>

<script>
import accordion from '@/components/accordion.vue'

export default {
  name: 'CurateHome',
  components: {
    accordion,
  }
}
</script>
