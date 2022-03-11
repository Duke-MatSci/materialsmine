<template>
  <tool-template :card="card" name="DescriptorCharacterize" :job="job" header="Physical Descriptors"
    :reference-list="references">
    <!-- card-specific slots -->
    <template #actions>
      <router-link to="DescriptorCharacterize">
        <md-button class="md-raised md-primary md-raised">
          Use Physical Descriptor Webtool
        </md-button>
      </router-link>
    </template>
    <!-- shared slots -->
    <template #title>
      Physical Descriptors
    </template>
    <template #content>
      Physical descriptors (aka features/predictors) provide a meaningful and convenient approach for direct elucidation
      of Processing-Structure-Property relations. Descriptors are important structural parameters that are highly
      related to material properties and provide a reduced dimension representation of microstructure. Extracting
      descriptors from a microstructure image involves application of image segmentation techniques to identify clusters
      of filler material followed by analysis of individual cluster. Although one can consider several descriptors, our
      webtool evaluates four descriptors - volume fraction, number of white phase aggregates, aspect ratio and nearest
      neighbor distance. This method is best suited for materials with particulate filler clusters that are
      spherical/ellipsoidal in shape.
    </template>
    <!-- tool page-specific slots-->
    <template #description>
      Upload a binarized image or a ZIP file containing set of images and click "Characterize" to get descriptors for
      filler material. The descriptors evaluated by this webtool are - filler volume fraction (equivalent to area
      fraction), number of filler clusters and area, aspect ratio & nearest neighbor distance of each filler cluster.
      Nearest neighbor distance of a cluster is the distance between its centroid and that of a cluster nearest to it.
      Except for volume fraction, number of clusters and aspect ratio (which are dimensionless), all descriptors have
      units of "pixels" ("pixel^2" for area descriptor).
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
          <strong>ZIP file with multiple images:</strong> Submit a ZIP file containing multiple images (supported
          formats: .jpg, .tif, .png) of same size (in pixels). DO NOT ZIP the folder containing images; select all
          images and ZIP them directly.
        </li>
      </ol>
    </template>
    <template #submit-button>
      <md-button class="md-layout-item md-size-100 md-primary md-raised">
        Characterize
      </md-button>
    </template>
  </tool-template>
</template>

<script>
import MCRToolTemplate from './MCRToolTemplate/MCRToolTemplate.vue'
export default {
  name: 'DescriptorCharacterize',
  components: {
    ToolTemplate: MCRToolTemplate
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
      job: {
        aspectRatio: 'free',
        getImageDimensions: true,
        submitJobTitle: 'DescriptorCharacterize',
        acceptableFileTypes: '.jpg, .png, .tif, .zip, .mat',
        useWebsocket: false
      },
      references: [
        '10.1115/1.4026649',
        '10.1016/j.commatsci.2013.12.046'
      ]
    }
  }
}
</script>
