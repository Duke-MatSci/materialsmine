<template>
  <div>
    <div class="section_teams">
      <div class="curate">
        <div>
          <h2 class="visualize_header-h1">Tools</h2>
          <div class="md-layout u_display-flex">
            <div class="md-layout-item md-layout-item_card">
              <router-link
                to="/explorer/tools/dynamfit"
                v-slot="{ navigate, href }"
                custom
              >
                <div
                  class="teams_container explorer_page-nav-card md-layout-item_card"
                  :href="href"
                  @click="navigate"
                >
                  <md-icon class="explorer_page-nav-card_icon"
                    >stacked_line_chart</md-icon
                  >
                  <span class="explorer_page-nav-card_text">DynamFit</span>
                  <p class="md-layout-item_para md-layout-item_para_fl">
                    A sign control algorithm that fits a viscoelastic
                    mastercurve from DMA experiments with a Prony Series.
                  </p>
                </div>
              </router-link>
            </div>
            <div class="md-layout-item md-layout-item_card">
              <router-link
                to="/nm/tools/chemprops"
                v-slot="{ navigate, href }"
                custom
              >
                <div
                  class="teams_container explorer_page-nav-card md-layout-item_card"
                  :href="href"
                  @click="navigate"
                >
                  <md-icon class="explorer_page-nav-card_icon"
                    >manage_search</md-icon
                  >
                  <span class="explorer_page-nav-card_text">ChemProps</span>
                  <p class="md-layout-item_para md-layout-item_para_fl">
                    A growing polymer name and filler name standardization
                    database.
                  </p>
                </div>
              </router-link>
            </div>
            <!-- TODO: The original Polymerizer tool is currently out of commision due to an attack on RPI systems  -->
            <!-- <div class="md-layout-item md-layout-item_card">
                                <div class="teams_container explorer_page-nav-card md-layout-item_card">
                                    <md-icon class="explorer_page-nav-card_icon">grain</md-icon>
                                    <span class="explorer_page-nav-card_text" style="text-align: center">Polymerizer</span>
                                    <p class="md-layout-item_para md-layout-item_para_fl">Short description of Polymerizer.</p>
                                </div>
                        </div> -->
          </div>
        </div>
        <div class="u_margin-top-med">
          <accordion
            :startOpen="false"
            :customTitle="true"
            :title="'Image Binarization'"
          >
            <template #custom_title>
              <h2 class="visualize_header-h1" style="margin-bottom: 0">
                Image Binarization
              </h2>
            </template>
            <div class="u_margin-top-small">
              <div>
                Binarization is the process of converting a micrograph to a
                black and white image (assuming there are only 2 phases) by
                removing noise and thus simplifying its analysis.
              </div>
              <div class="u_margin-bottom-small">
                All 'Characterization and Reconstruction' algorithms work with
                binarized images only.
              </div>
              <div
                class="md-layout u_display-flex md-layout-responsive u_margin-top-med"
              >
                <div class="md-layout-item md-layout-item_card">
                  <router-link
                    to="/nm/tools/Otsu"
                    v-slot="{ navigate, href }"
                    custom
                  >
                    <div
                      class="teams_container explorer_page-nav-card md-layout-item_card"
                      :href="href"
                      @click="navigate"
                    >
                      <md-icon class="explorer_page-nav-card_icon"
                        >compare</md-icon
                      >
                      <span class="explorer_page-nav-card_text"
                        >Otsu's Method</span
                      >
                      <p class="md-layout-item_para md-layout-item_para_fl">
                        Works well for relatively noise free images having
                        significant contrast between filler and matrix material.
                      </p>
                    </div>
                  </router-link>
                </div>

                <div class="md-layout-item md-layout-item_card">
                  <router-link
                    to="/nm/tools/Niblack"
                    v-slot="{ navigate, href }"
                    custom
                  >
                    <div
                      class="teams_container explorer_page-nav-card md-layout-item_card"
                      :href="href"
                      @click="navigate"
                    >
                      <md-icon class="explorer_page-nav-card_icon"
                        >compare</md-icon
                      >
                      <span class="explorer_page-nav-card_text"
                        >Niblack's Method</span
                      >
                      <p class="md-layout-item_para md-layout-item_para_fl">
                        Works well for gray-level images with low contrast
                        between filler and matrix material.
                      </p>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
          </accordion>
        </div>
        <div class="u_margin-top-med">
          <accordion
            :startOpen="false"
            :customTitle="true"
            :title="'Microstructure Characterization'"
          >
            <template #custom_title>
              <h2 class="visualize_header-h1" style="margin-bottom: 0">
                Microstructure Characterization
              </h2>
            </template>
            <div class="u_margin-top-small">
              Microstructure Characterization refers to a statistical
              quantification of morphology. It essentially converts
              multi-dimensional microstructure recorded in images into a set of
              functions (aka features/descriptors/predictors) that encode
              significant morphological details. The functions obtained as a
              result are useful in developing insights on structure - property
              relationships and serve as the basis for reconstruction
              algorithms.
            </div>
            <div class="u_margin-bottom-small">
              Upload a binarized microstructure image / set of images and obtain
              characterization data of your choice.
            </div>
            <div
              class="md-layout u_display-flex md-layout-responsive u_margin-top-med"
            >
              <div
                class="md-layout-item md-layout-item_card md-layout-item_card-tall"
              >
                <router-link
                  to="/nm/tools/IntelligentCharacterize"
                  v-slot="{ navigate, href }"
                  custom
                >
                  <div
                    class="teams_container explorer_page-nav-card md-layout-item_card md-layout-item_card-tall"
                    :href="href"
                    @click="navigate"
                  >
                    <md-icon class="explorer_page-nav-card_icon"
                      >image_search</md-icon
                    >
                    <span
                      class="explorer_page-nav-card_text"
                      style="text-align: center"
                      >Intelligent Characterization</span
                    >
                    <p class="md-layout-item_para md-layout-item_para_fl">
                      Analyzes uploaded image(s) to select the most suitable
                      characterization method.
                    </p>
                  </div>
                </router-link>
              </div>
              <div
                class="md-layout-item md-layout-item_card md-layout-item_card-tall"
              >
                <router-link
                  to="/nm/tools/CorrelationCharacterize"
                  v-slot="{ navigate, href }"
                  custom
                >
                  <div
                    class="teams_container explorer_page-nav-card md-layout-item_card md-layout-item_card-tall"
                    :href="href"
                    @click="navigate"
                  >
                    <md-icon class="explorer_page-nav-card_icon"
                      >ssid_chart</md-icon
                    >
                    <span class="explorer_page-nav-card_text"
                      >Correlation Functions</span
                    >
                    <p class="md-layout-item_para md-layout-item_para_fl">
                      Webtool that evaluates autocorrelation, lineal path,
                      cluster and surface correlation.
                    </p>
                  </div>
                </router-link>
              </div>
              <div
                class="md-layout-item md-layout-item_card md-layout-item_card-tall"
              >
                <router-link
                  to="/nm/tools/DescriptorCharacterize"
                  v-slot="{ navigate, href }"
                  custom
                >
                  <div
                    class="teams_container explorer_page-nav-card md-layout-item_card md-layout-item_card-tall"
                    :href="href"
                    @click="navigate"
                  >
                    <md-icon class="explorer_page-nav-card_icon"
                      >ssid_chart</md-icon
                    >
                    <span class="explorer_page-nav-card_text"
                      >Physical Descriptors</span
                    >
                    <p class="md-layout-item_para md-layout-item_para_fl">
                      Webtool that evaluates volume fraction, number of white
                      phase aggregates, aspect ratio and nearest neighbor
                      distance.
                    </p>
                  </div>
                </router-link>
              </div>
              <div
                class="md-layout-item md-layout-item_card md-layout-item_card-tall"
              >
                <router-link
                  to="/nm/tools/SDFCharacterize"
                  v-slot="{ navigate, href }"
                  custom
                >
                  <div
                    class="teams_container explorer_page-nav-card md-layout-item_card md-layout-item_card-tall"
                    :href="href"
                    @click="navigate"
                  >
                    <md-icon class="explorer_page-nav-card_icon"
                      >ssid_chart</md-icon
                    >
                    <span class="explorer_page-nav-card_text"
                      >Spectral Density</span
                    >
                    <p class="md-layout-item_para md-layout-item_para_fl">
                      A frequency domain microstructure representation where
                      different frequencies represent real space features at
                      different length scales.
                    </p>
                  </div>
                </router-link>
              </div>
            </div>
          </accordion>
        </div>
        <div class="u_margin-top-med">
          <accordion
            :startOpen="false"
            :customTitle="true"
            :title="'Microstructure Reconstruction'"
          >
            <template #custom_title>
              <h2 class="visualize_header-h1" style="margin-bottom: 0">
                Microstructure Reconstruction
              </h2>
            </template>
            <div class="u_margin-top-small">
              Reconstruction involves constructing a statistically equivalent
              microstructure image given some statistical characterization. In
              most cases, reconstruction is cast as an optimization problem;
              with the goal of matching characteristics of reconstructed image
              to that of input image.
            </div>
            <div class="u_margin-bottom-small">
              In this section, you can upload a binary microstructure image /
              set of images and obtain 2D/3D reconstructions using method of
              your choice.
            </div>
            <div
              class="md-layout u_display-flex md-layout-responsive u_margin-top-med"
            >
              <div class="md-layout-item md-layout-item_card">
                <a
                  href="https://ideal.mech.northwestern.edu/research/software/download/"
                  target="_blank"
                >
                  <div
                    class="teams_container explorer_page-nav-card md-layout-item_card"
                  >
                    <md-icon class="explorer_page-nav-card_icon"
                      >ssid_chart</md-icon
                    >
                    <span class="explorer_page-nav-card_text"
                      >Transfer Learning</span
                    >
                    <p class="md-layout-item_para md-layout-item_para_fl">
                      Captures spatial correlations for microstructure
                      reconstruction by leveraging the superior capabilities of
                      deep convolution networks. Click to request access link.
                    </p>
                  </div>
                </a>
              </div>
              <div class="md-layout-item md-layout-item_card">
                <router-link
                  to="/nm/tools/CorrelationReconstruct"
                  v-slot="{ navigate, href }"
                  custom
                >
                  <div
                    class="teams_container explorer_page-nav-card md-layout-item_card"
                    :href="href"
                    @click="navigate"
                  >
                    <md-icon class="explorer_page-nav-card_icon"
                      >ssid_chart</md-icon
                    >
                    <span class="explorer_page-nav-card_text"
                      >Correlation Functions</span
                    >
                    <p class="md-layout-item_para md-layout-item_para_fl">
                      Employs the Yeong-Torquato method to match the correlation
                      function of 2D reconstructed image to that of 2D input
                      image.
                    </p>
                  </div>
                </router-link>
              </div>
              <div class="md-layout-item md-layout-item_card">
                <router-link
                  to="/nm/tools/DescriptorReconstruct"
                  v-slot="{ navigate, href }"
                  custom
                >
                  <div
                    class="teams_container explorer_page-nav-card md-layout-item_card"
                    :href="href"
                    @click="navigate"
                  >
                    <md-icon class="explorer_page-nav-card_icon"
                      >ssid_chart</md-icon
                    >
                    <span class="explorer_page-nav-card_text"
                      >Physical Descriptors</span
                    >
                    <p class="md-layout-item_para md-layout-item_para_fl">
                      Webtool that creates a 3D reconstruction from the 2D input
                      image.
                    </p>
                  </div>
                </router-link>
              </div>
              <div class="md-layout-item md-layout-item_card">
                <router-link
                  to="/nm/tools/SDFReconstruct"
                  v-slot="{ navigate, href }"
                  custom
                >
                  <div
                    class="teams_container explorer_page-nav-card md-layout-item_card"
                    :href="href"
                    @click="navigate"
                  >
                    <md-icon class="explorer_page-nav-card_icon"
                      >ssid_chart</md-icon
                    >
                    <span class="explorer_page-nav-card_text"
                      >Spectral Density</span
                    >
                    <p class="md-layout-item_para md-layout-item_para_fl">
                      Reconstruction method that involves level-cutting a
                      Gaussian Random Field with the same SDF as the input
                      image.
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
    accordion
  }
}
</script>
