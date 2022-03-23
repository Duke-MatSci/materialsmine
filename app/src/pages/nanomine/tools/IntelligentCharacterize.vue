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
      Chi-square fit:
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
        <mrow>
          <mi>y</mi>
          <mo>=</mo>
          <mi>a</mi>
          <mo>*</mo>
          <msub>
            <mrow>
              <mi>f</mi>
            </mrow>
            <mrow>
              <mi>k</mi>
            </mrow>
          </msub>
          <mo stretchy="false">(</mo>
          <mi>b</mi>
          <mo>*</mo>
          <mi>x</mi>
          <mo>,</mo>
          <mi>n</mi>
          <mo stretchy="false">)</mo>
        </mrow>
      </math>,
      where
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
        <msub>
          <mrow>
            <mi>f</mi>
          </mrow>
          <mrow>
            <mi>k</mi>
          </mrow>
        </msub>
      </math>
      is the probability
      density function of chi-square distribution.
      <br>
      Gamma fit:
       <math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
        <mrow>
          <mi>y</mi>
          <mo>=</mo>
          <mi>a</mi>
          <mo>*</mo>
          <msub>
            <mrow>
              <mi>f</mi>
            </mrow>
            <mrow>
              <mi>g</mi>
            </mrow>
          </msub>
          <mrow>
            <mo>(</mo>
            <mrow>
              <mi>x</mi>
              <mo>-</mo>
              <msub>
                <mrow>
                  <mi>x</mi>
                </mrow>
                <mrow>
                  <mn>0</mn>
                </mrow>
              </msub>
              <mo>,</mo>
              <mi>b</mi>
              <mo>,</mo>
              <mi>c</mi>
            </mrow>
            <mo>)</mo>
          </mrow>
        </mrow>
      </math>,
      where
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">
        <msub>
          <mrow>
            <mi>f</mi>
          </mrow>
          <mrow>
            <mi>g</mi>
          </mrow>
        </msub>
      </math>
      is the probability density function of gamma distribution.
      <br>
      Gaussian fit:
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="display">
        <mrow>
          <mi>y</mi>
          <mo>=</mo>
          <mi>a</mi>
          <mo>*</mo>
          <mo>exp</mo>
          <mrow>
            <mo>[</mo>
            <mrow>
              <mo>-</mo>
              <mi>b</mi>
              <mo>*</mo>
              <msup>
                <mrow>
                  <mrow>
                    <mo>(</mo>
                    <mrow>
                      <mi>x</mi>
                      <mo>-</mo>
                      <msub>
                        <mrow>
                          <mi>x</mi>
                        </mrow>
                        <mrow>
                          <mn>0</mn>
                        </mrow>
                      </msub>
                    </mrow>
                    <mo>)</mo>
                  </mrow>
                </mrow>
                <mrow>
                  <mn>2</mn>
                </mrow>
              </msup>
            </mrow>
            <mo>]</mo>
          </mrow>
        </mrow>
      </math>
      <br>
      Step function fit:
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="display">
        <mrow>
          <mi>y</mi>
          <mo>=</mo>
          <mi>a</mi>
          <mo>*</mo>
          <mrow>
            <mo>[</mo>
            <mrow>
              <mi>h</mi>
              <mrow>
                <mo>(</mo>
                <mrow>
                  <mi>x</mi>
                  <mo>-</mo>
                  <msub>
                    <mrow>
                      <mi>x</mi>
                    </mrow>
                    <mrow>
                      <mn>1</mn>
                    </mrow>
                  </msub>
                </mrow>
                <mo>)</mo>
              </mrow>
              <mo>-</mo>
              <mi>h</mi>
              <mrow>
                <mo>(</mo>
                <mrow>
                  <mi>x</mi>
                  <mo>-</mo>
                  <msub>
                    <mrow>
                      <mi>x</mi>
                    </mrow>
                    <mrow>
                      <mn>2</mn>
                    </mrow>
                  </msub>
                </mrow>
                <mo>)</mo>
              </mrow>
            </mrow>
            <mo>]</mo>
          </mrow>
        </mrow>
      </math>,
      where
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="display">
        <mrow>
          <mi>
            h
          </mi>
        </mrow>
      </math>
      is the Heaviside function.
      <br>
      Exponential fit:
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="display">
        <mrow>
          <mi>y</mi>
          <mo>=</mo>
          <mi>a</mi>
          <mo>*</mo>
          <mo>exp</mo>
          <mrow>
            <mo>[</mo>
            <mrow>
              <mo>-</mo>
              <mi>b</mi>
              <mo>*</mo>
              <mrow>
                <mo>(</mo>
                <mrow>
                  <mi>x</mi>
                  <mo>-</mo>
                  <msub>
                    <mrow>
                      <mi>x</mi>
                    </mrow>
                    <mrow>
                      <mn>0</mn>
                    </mrow>
                  </msub>
                </mrow>
                <mo>)</mo>
              </mrow>
            </mrow>
            <mo>]</mo>
          </mrow>
        </mrow>
      </math>
      <br>
      Double peak fit:
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="display">
        <mrow>
          <mi>y</mi>
          <mo>=</mo>
          <msub>
            <mrow>
              <mi>a</mi>
            </mrow>
            <mrow>
              <mn>1</mn>
            </mrow>
          </msub>
          <mo>*</mo>
          <mo>exp</mo>
          <mrow>
            <mo>[</mo>
            <mrow>
              <mo>-</mo>
              <msub>
                <mrow>
                  <mi>b</mi>
                </mrow>
                <mrow>
                  <mn>1</mn>
                </mrow>
              </msub>
              <mo>*</mo>
              <msup>
                <mrow>
                  <mrow>
                    <mo>(</mo>
                    <mrow>
                      <mi>x</mi>
                      <mo>-</mo>
                      <msub>
                        <mrow>
                          <mi>x</mi>
                        </mrow>
                        <mrow>
                          <mn>1</mn>
                        </mrow>
                      </msub>
                    </mrow>
                    <mo>)</mo>
                  </mrow>
                </mrow>
                <mrow>
                  <mn>2</mn>
                </mrow>
              </msup>
            </mrow>
            <mo>]</mo>
          </mrow>
          <mo>+</mo>
          <msub>
            <mrow>
              <mi>a</mi>
            </mrow>
            <mrow>
              <mn>2</mn>
            </mrow>
          </msub>
          <mo>*</mo>
          <mrow>
            <mo>[</mo>
            <mrow>
              <mo>-</mo>
              <msub>
                <mrow>
                  <mi>b</mi>
                </mrow>
                <mrow>
                  <mn>2</mn>
                </mrow>
              </msub>
              <mo>*</mo>
              <msup>
                <mrow>
                  <mrow>
                    <mo>(</mo>
                    <mrow>
                      <mi>x</mi>
                      <mo>-</mo>
                      <msub>
                        <mrow>
                          <mi>x</mi>
                        </mrow>
                        <mrow>
                          <mn>2</mn>
                        </mrow>
                      </msub>
                    </mrow>
                    <mo>)</mo>
                  </mrow>
                </mrow>
                <mrow>
                  <mn>2</mn>
                </mrow>
              </msup>
            </mrow>
            <mo>]</mo>
          </mrow>
        </mrow>
      </math>
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
export default {
  name: 'IntelligentCharacterize',
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
