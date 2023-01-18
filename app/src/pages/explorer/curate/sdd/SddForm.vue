<template>
<div>
<div>
  <div>
    <CurateNavBar active="Direct Upload with SDD" :navRoutes="navRoutes"/>
  </div>
  <div class="curate">
    <div>
    <div>
      <md-card style="margin: 10px" >
        <form class="modal-content" action="" method="post"
          enctype="multipart/form-data"
          upload_type="http://www.w3.org/ns/dcat#Dataset">
        <md-steppers class="form__stepper" :md-active-step.sync="active" md-linear>

          <md-step id="first" md-label="Upload files" >
            <div style="margin: 20px">
            <md-field style="max-width: 100%;">
              <label>DOI of related publication (e.g., 10.1000/000)</label>
              <md-input v-model="dataset.doi"></md-input>
            </md-field>

            <FileInput @files-dropped="addDistr">
              <label for="file-distr-input">
                <div class="form__file-input">
                  <div class="md-field md-theme-default md-required md-has-file">
                    <md-icon>attach_file</md-icon> 
                    <label for="file-distr-input">Select files to upload for this dataset</label>
                    <div class="md-file" multiple isinvalidvalue=false>
                      <input type="file" id="file-distr-input" multiple @change="onInputChange"/>
                    </div>
                    <span class="md-error" style="margin-left:40px">At least one distribution is required</span>
                  </div>
                </div>
              </label>
            </FileInput>

            <div class="md-layout" v-show="dataset.distrFiles.length">
              <md-list class="md-layout utility-transparentbg md-theme-default">
              <FilePreview v-for="file in dataset.distrFiles" :key="file.id" :file="file" tag="div" classname="md-layout-item" @remove="removeDistr" />
              </md-list>
            </div>

            <FileInput @files-dropped="previewFile()">
              <label for="file-depict-input">
                <div class="form__file-input">
                  <div class="md-field md-theme-default md-has-file">
                    <md-icon>attach_file</md-icon> 
                    <label for="file-depict-input">Select a representative image to use as thumbnail</label>
                    <div class="md-file" multiple isinvalidvalue=false>
                      <input type="file" id="file-depict-input" multiple @change="previewFile()" accept="image/*"/>
                    </div>
                  </div>
                </div>
              </label>
            </FileInput>

            <div id="depictWrapper" class="u--margin-toplg justify-center" style="visibility: hidden; height:200px;margin: 5rem; display: flex; justify-content: center">
              <figure>
                <img id="depictImg" src="" alt="Image preview..."  style="height:200px">
                <figcaption v-if="dataset.depiction">{{dataset.depiction.name}}</figcaption>
              </figure>
              <md-button @click="removeImage" type="button" class="close md-raised">Remove image</md-button>
            </div>

            </div>
            <div class="md-layout md-gutter md-alignment-top-right">
              <div class="md-layout-item md-size-10">
                <md-button
                  @click="goToStep('first', 'second')"
                  class="md-theme-default md-button_next">
                  Next
                </md-button>
              </div>
              <!-- <div class="md-layout-item" v-if="doiLoading">
                <md-progress-spinner :md-diameter="30" :md-stroke="3" md-mode="indeterminate"></md-progress-spinner>
              </div> -->
            </div>
          </md-step>

          <md-step id="second" md-label="Provide additional info">
            <div class="md-layout">
            <!---------- General Info fields ---------->
            <md-content style="width: 100%; margin: 20px">
              <div class="md-headline" style="margin-top: 10px">
                General Information
              </div>
              <md-field style="max-width: 100%;" >
                <label>Title</label>
                <md-input v-model="dataset.title" required></md-input>
                <span class="md-error">Title required</span>
              </md-field>

              <div class="md-subheading" style="margin-top: 40px;">Contact Point</div>
              <div class="md-layout md-gutter" style="align-items: center;">

                <div class="md-layout-item md-size-30 md-xsmall-size-100 md-medium-size-50">
                  <md-field>
                    <label style="font-size:14px">ORCID Identifier (e.g., 0000-0001-2345-6789)</label>
                    <md-input v-model="dataset.contactPoint.orcidId" required ></md-input>
                    <span class="md-error">ORCID iD required</span>
                  </md-field>
                </div>

                <div class="md-layout-item md-size-20 md-xsmall-size-100 md-medium-size-50">
                  <md-field >
                    <label>First name</label>
                    <md-input v-model="dataset.contactPoint.cpFirstName" required></md-input>
                    <span class="md-error">Contact point required</span>
                  </md-field>
                </div>

                <div class="md-layout-item md-size-20 md-xsmall-size-100 md-medium-size-50">
                  <md-field  >
                    <label>Last name</label>
                    <md-input v-model="dataset.contactPoint.cpLastName" required></md-input>
                    <span class="md-error">Contact point required</span>
                  </md-field>
                </div>

                <div class="md-layout-item md-size-25 md-xsmall-size-100 md-medium-size-50">
                  <md-field   style="max-width: 100%;">
                    <label>Email</label>
                    <md-input v-model="dataset.contactPoint.cpEmail" required></md-input>
                    <span class="md-error">Valid email required</span>
                  </md-field>
                </div>
              </div>

              <!-- <div style="color: red; margin-bottom: 20px; text-align: center;" v-if="cpIDError">
                No results found for {{cpID}}
              </div> -->

              <div style="margin: 40px; text-align: center;">
                Don't have an ORCID iD?
                <a href="https://orcid.org/" target="_blank">Create one here</a>
              </div>

              <md-field style="max-width: 100%;"  >
                <label>Text Description</label>
                <md-textarea v-model="dataset.description" required></md-textarea>
                <span class="md-error">Description required</span>
              </md-field>

            </md-content>

            <md-divider style="border-style: solid" width="100%"></md-divider>

            <!---------- TODO: Contributor fields -------->
            <md-content style="width: 100%; margin: 20px">
              <div class="md-headline" style="margin-top: 10px; margin-bottom: 10px">
                Contributors
              </div>

              <div>
              <table class="table" width="100%" style="border-collapse: collapse;">
                <tbody>
                  <tr >
                  <td style="width:100%">
                    <tr v-for="(row, index) in []"
                      v-bind:key="index + 'contr'"
                      style="border-top: 0.5pt lightgray solid"
                    >
                      <td style="width:50%">
                        {{contributors[index]['name']}}
                      </td>
                      <td style="width:40%">
                        <!-- <md-autocomplete
                          style="max-width: 90%;"

                          :md-options="autocomplete.availableInstitutions"
                          :md-open-on-focus="false"
                          @md-changed="resolveEntityInstitution"
                          @md-selected="selectedOrgChange(index, $event)"
                        >
                          <label>Organization</label>

                          <template style="max-width: 90%;" slot="md-autocomplete-item" slot-scope="{ item, term }">
                            <md-highlight-text :md-term="term">{{ item.label }}</md-highlight-text>
                          </template>

                          <template style="max-width: 90%;" slot="md-autocomplete-empty" slot-scope="{ term }">
                            <p>No organizations matching "{{ term }}" were found.</p>
                            <a style="cursor: pointer">Create new</a>
                          </template>
                        </md-autocomplete> -->

                      </td>
                      <td>
                        <a style="cursor: pointer" >Remove</a>
                      </td>
                    </tr>
                  </td>
                  </tr>
                </tbody>

              </table>
              </div>
            </md-content>

            <md-divider style="border-style: solid" width="100%"></md-divider>

            <!-- -------- Publication Info fields -------- -->
            <md-content style="width: 100%; margin: 20px">
              <div class="md-headline" style="margin-top: 10px; margin-bottom: 10px">
                Publication Information
              </div>
              <div style="width: 100%">
                <div class="md-layout md-gutter">
                  <div class="md-layout-item md-size-50">
                    <label>Date Last Modified</label>
                    <md-field>
                      <md-input v-model="dataset.dateMod" type="date"></md-input>
                    </md-field>
                  </div>
                </div>
              </div>
            </md-content> 

            <md-card-actions style="width: 100%; height: 100%; margin: 20px; padding-top:5rem;">
              <div class="md-layout md-gutter ">
                <div class="md-layout-item md-size-10">
                  <md-button
                    @click="goToStep('second', 'first')"
                    class="md-theme-default md-button_prev">
                    Previous
                  </md-button>
                </div>
                <div class="md-layout-item md-size-75">
                </div>
                <div class="md-layout-item md-size-10">
                  <md-button
                    @click="goToStep('second', 'third')"
                    class="md-theme-default md-button_next">
                    Next
                  </md-button>
                </div>
              </div>
            </md-card-actions>
              <!-- <span v-if="isInvalidForm" class="md-error" style="color:red">Check for errors in required fields</span> -->
            </div>
          </md-step>

          <md-step id="third" md-label="Confirm and Submit">
            <div class="md-headline" style="margin: 10px">
              Form Results
            </div>
            <div class="u--margin-pos"><h3>Title:</h3> {{ dataset.title }} </div>
            <div class="u--margin-pos"><h3>DOI:</h3> {{dataset.doi}} </div>
            <div class="u--margin-pos">
            <h3>Selected files: </h3>
              <div v-for="(file, index) in dataset.distrFiles" :key="index">
              {{file.file.name}}
              </div>
            </div>
            <div v-if="dataset.depiction" class="u--margin-pos"><h3>Depiction</h3> {{dataset.depiction.name}} </div>
            <div class="u--margin-pos"><h3>Description:</h3> {{dataset.description}}</div>
            <div class="u--margin-pos"><h3>Date last modified:</h3> {{dataset.dateMod}}</div>
            <md-card-actions>
              <md-button class="md-primary" >Submit</md-button>
            </md-card-actions>
          </md-step>
        </md-steppers>
        </form>
      </md-card>
    </div>
    </div>
  </div>
</div>
</div>
</template>

<script>
import FileDrop from '@/components/curate/FileDrop.vue'
import FilePreview from '@/components/curate/FilePreview.vue'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
import useFileList from '@/modules/file-list'

const distrFn = useFileList()

export default {
  name: 'SDDHome',
  components: {
    FileInput: FileDrop,
    FilePreview,
    CurateNavBar
  },
  data () {
    return {
      auth: true,
      loading: false,
      navRoutes: [
        {
          label: 'Curate',
          path: '/explorer/curate'
        }
      ],
      // Stepper data
      active: 'first',
      dataset: {
        // Dataset info: Step 1
        doi: '',
        distrFiles: distrFn.files,
        depiction: [],
        // Dataset info: Step 2
        title: '',
        contactPoint: {
          orcidId: '',
          cpFirstName: '',
          cpLastName: '',
          cpEmail: '',
        },
        description: '',
        contributors: [],
        dateMod: '',
      }
    }
  },
  methods: {
    addDistr: distrFn.addFiles,
    removeDistr: distrFn.removeFile,
    modStatDistr: distrFn.modifyStatus,
    navBack () {
      this.$router.back()
    },
    onInputChange (e) {
      this.addDistr(e.target.files)
      e.target.value = null
    },
    goToStep (id, index) {
      this[id] = true
      if (index) {
        this.active = index
      }
    },
    // Load a thumbnail of the representative image
    previewFile() { 
      const preview = document.querySelector('#depictImg');
      const wrapper = document.querySelector('#depictWrapper')
      const file = document.querySelector('#file-depict-input').files[0]; 
      const reader = new FileReader();
      this.dataset.depiction = file
    
      reader.addEventListener("load", function () { 
        wrapper.style.visibility = "visible";
        preview.src = reader.result; 
      }, false);
    
      if (file) {  
        reader.readAsDataURL(file);
      }
    },
    removeImage(){ 
      document.querySelector('#depictWrapper').style.visibility = "hidden"; 
      document.querySelector('#file-depict-input').value = "";
      document.querySelector('#depictImg').src=""; 
      this.dataset.depiction = null;
    }
  }
}
</script>
