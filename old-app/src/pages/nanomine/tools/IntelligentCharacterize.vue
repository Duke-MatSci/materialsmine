<template>
  <tool-template :card="card" name="IntelligentCharacterize" :job="job" header="Intelligent Characterization"
    :reference-list="references">
    <!-- card-specific slots -->
    <template #image>
      <img src="@/assets/img/nanomine/Intelligent_Characterization.png" alt="Intelligent Characterization">
    </template>
    <template #actions>
      <router-link to="IntelligentCharacterize">
        <md-button class="md-raised md-primary md-raised">
          Use Intelligent Characterization Webtool
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Intelligent Characterization
    </template>
    <template #content>
      The intelligent characterization tool selects the most suitable characterization method between the “physical
      descriptors” and the “spectral density function (SDF)” approaches based on analyzing the user uploaded image(s).
      Results generated can be easily passed to the NanoMine Database.
    </template>
    <!-- tool page-specific slots-->
    <template #description>
      This tool assesses the uploaded image(s) of microstructure and performs analysis to decide which characterization
      method suits the best. The process consists of three steps:
      <br>
      <ol>
        <li>Calculate universal descriptors, i.e., void fraction, isotropy index, and interfacial area.</li>
        <li> Determine whether Spheroidal Descriptors or Spectral Density Function (SDF) is more applicable, based on
          isotropy index and connectivity index. If the material is not isotropic or too connected, then the Spheroidal
          Descriptors are not applicable.</li>
        <li>Generate results for either Spheroidal Descriptors or SDF representation. If Spheroidal Descriptor method is
          chosen, results of Nearest Neighbor Distance, Number of clusters, Compactness, Cluster Area, Cluster Radius,
          Elongation Ratio, Orientation Angle, and Rectangularity will be provided. If the SDF method is chosen, the
          following five different forms of SDF will be tested and the best fitted form will be chosen with output of
          the fitted parameters and the goodness of fit value.</li>
      </ol>
      <br>
      Chi-square fit: <vue-mathjax formula="$y = a * f_k(b * x, n)$"></vue-mathjax>, where <vue-mathjax formula="$f_k$"></vue-mathjax> is the probability density function of chi-square distribution.
      <br>
      Gamma fit: <vue-mathjax formula="$y = a * f_g\left(x - x_0, b, c\right)$"></vue-mathjax>, where <vue-mathjax formula="$f_g$"></vue-mathjax> is the probability density function of gamma distribution.
      <br>
      Gaussian fit: <vue-mathjax formula="$y = a * \exp\left[-b * \left(x - x_0\right)^2\right]$"></vue-mathjax>
      <br>
      Step function fit: <vue-mathjax formula="$y = a * \left[h\left(x - x_1\right) - h\left(x - x_2\right)\right]$"></vue-mathjax>, where <vue-mathjax formula="$h$"></vue-mathjax> is the Heaviside function.
      <br>
      Exponential fit: <vue-mathjax formula="$y = a * \exp\left[-b * \left(x - x_0\right)\right]$"></vue-mathjax>
      <br>
      Double peak fit: <vue-mathjax formula="$y = a_1 * \exp\left[-b_1 * \left(x - x_1\right)^2\right] + a_2 * \left[-b_2 * \left(x - x_2\right)^2\right]$"></vue-mathjax>
    </template>
    <template #input-options>
      <ol>
        <li>
          <strong>Single image:</strong> Supported image formats are .jpg, .tif and .png.
        </li>
        <li>
          <strong>Single image in .mat format:</strong> The .mat file must contain ONLY ONE variable named "Input,"
          which contains the image.
        </li>
        <li>
          <strong>ZIP file with multiple images:</strong> Submit a ZIP file containing multiple images
          (supported formats: .jpg, .tif, .png) of same size (in pixels). DO NOT ZIP the folder containing images;
          select all images and ZIP them directly.
        </li>
      </ol>
    </template>
    <template #submit-button>
      Characterize
    </template>
  </tool-template>
</template>

<script>
import MCRToolTemplate from './MCRToolTemplate/MCRToolTemplate.vue'
import { VueMathjax } from 'vue-mathjax'
export default {
  name: 'IntelligentCharacterize',
  components: {
    ToolTemplate: MCRToolTemplate,
    'vue-mathjax': VueMathjax
  },
  props: {
    card: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data: function () {
    return {
      references: [
        '10.1016/j.pmatsci.2018.01.005'
      ],
      job: {
        aspectRatio: 'free',
        getImageDimensions: true,
        submitJobTitle: 'IntelligentCharacterize',
        acceptableFileTypes: '.jpg, .png, .tif, .zip, .mat',
        useWebsocket: false
      }
    }
  }
}
</script>
