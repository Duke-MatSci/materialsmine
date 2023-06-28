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

          <md-step id="first" md-label="Upload files" :md-error="invalid.first">
            <div style="margin: 20px">
            <md-field style="max-width: 100%;">
              <label>DOI of related publication (e.g., 10.1000/000)</label>
              <md-input v-model="doi" @change="lookupDoi"></md-input>
            </md-field>

            <FileInput @files-dropped="addDistr">
              <label for="file-distr-input">
                <div class="form__file-input">
                  <div class="md-field md-theme-default md-required md-has-file" :class="{ 'md-invalid': invalid['first'] }">
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
                    <label for="file-depict-input">Select an image to use as a cover for the dataset (optional)</label>
                    <div class="md-file" multiple isinvalidvalue=false>
                      <input type="file" id="file-depict-input" multiple @change="previewFile()" accept="image/*"/>
                    </div>
                  </div>
                </div>
              </label>
            </FileInput>

            <div id="depictWrapper" class="u--margin-toplg justify-center" style="visibility: hidden; height:200px;margin: 5rem; display: flex; justify-content: center">
              <figure>
                <img id="depictImg" src="" alt="Image preview..." style="height:200px">
                <figcaption v-if="dataset.depiction">{{dataset.depiction.name}}</figcaption>
              </figure>
              <md-button @click="removeImage" type="button" class="close md-raised">Remove image</md-button>
            </div>

            </div>
            <div class="md-layout md-gutter md-alignment-top-right">
              <div class="md-layout-item md-size-10 md-medium-size-15 md-small-size-20 md-xsmall-size-40">
                <md-button
                  @click="goToStep('first', 'second')"
                  class="md-theme-default md-button_next">
                  Next
                </md-button>
              </div>
            </div>
          </md-step>

          <md-step id="second" md-label="Provide additional info" :md-error="invalid.second">
            <div class="md-layout">
            <!---------- General Info fields ---------->
            <md-content class="u_width--max" style="margin: 20px">
              <div class="md-headline" style="margin-top: 10px">
                General Information
              </div>
              <md-field style="max-width: 100%;" :class="{ 'md-invalid': (invalid['second'] && !dataset.title) }">
                <label>Title</label>
                <md-input v-model="dataset.title" required></md-input>
                <span class="md-error">Title required</span>
              </md-field>

              <div class="md-subheading" style="margin-top: 40px;">Contact Point</div>
              <div class="md-layout md-gutter" style="align-items: center">

                <div class="md-layout-item md-size-30 md-xsmall-size-100 md-medium-size-50 u_margin-bottom-med">
                  <md-field :class="{ 'md-invalid': ((invalid['second'] && !dataset.contactPoint['@id']) || invalid.orcid) }">
                    <label style="font-size:14px">ORCID Identifier (e.g., 0000-0001-2345-6789)</label>
                    <md-input v-model="dataset.contactPoint['@id']" required @change="lookupOrcid" ></md-input>
                    <span class="md-error" v-if="!invalid.orcid">ORCID ID required</span>
                    <span class="md-error" v-if="invalid.orcid">Invalid ORCID ID</span>
                  </md-field>
                </div>

                <div class="md-layout-item md-size-25 md-xsmall-size-100 md-medium-size-50 u_margin-bottom-med">
                  <md-field :class="{ 'md-invalid': (invalid['second'] && !dataset.contactPoint.cpEmail) }" class="u_width--max">
                    <label>Email</label>
                    <md-input v-model="dataset.contactPoint.cpEmail" required></md-input>
                    <span class="md-error">Valid email required</span>
                  </md-field>
                </div>

                <div class="md-layout-item md-size-20 md-xsmall-size-100 md-medium-size-50 u_margin-bottom-med">
                  <md-field :class="{ 'md-invalid': (invalid['second'] && !dataset.contactPoint.cpFirstName) }">
                    <label>First name</label>
                    <md-input v-model="dataset.contactPoint.cpFirstName" required></md-input>
                    <span class="md-error">Contact point required</span>
                  </md-field>
                </div>

                <div class="md-layout-item md-size-20 md-xsmall-size-100 md-medium-size-50 u_margin-bottom-med">
                  <md-field :class="{ 'md-invalid': (invalid['second'] && !dataset.contactPoint.cpLastName) }">
                    <label>Last name</label>
                    <md-input v-model="dataset.contactPoint.cpLastName" required></md-input>
                    <span class="md-error">Contact point required</span>
                  </md-field>
                </div>
              </div>

              <div style="margin: 40px; text-align: center;">
                Don't have an ORCID iD?
                <a href="https://orcid.org/" target="_blank">Create one here</a>
              </div>

              <md-field class="u_width--max" :class="{ 'md-invalid': (invalid['second'] && !dataset.description) }">
                <label>Text Description</label>
                <md-textarea v-model="dataset.description" required></md-textarea>
                <span class="md-error">Description required</span>
              </md-field>

            </md-content>

            <md-divider class="u_width--max" style="border-style: solid"></md-divider>

            <!---------- TODO: Contributor fields -------->
            <!-- <md-content style="width: 100%; margin: 20px">
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

            <md-divider style="border-style: solid" width="100%"></md-divider> -->

            <!-- -------- Publication Info fields -------- -->
            <md-content class="u_width--max" style="margin: 20px">
              <div class="md-headline" style="margin-top: 10px; margin-bottom: 10px">
                Publication Information
              </div>
              <div class="u_width--max">
                <div class="md-layout md-gutter">
                  <div class="md-layout-item md-size-50">
                    <label>Date Published</label>
                    <md-field>
                      <md-input v-model="dataset.datePub['@value']" type="date"></md-input>
                    </md-field>
                  </div>
                </div>
              </div>
            </md-content>

            <md-card-actions class="u_width--max u_height--max" style="margin: 20px; padding-top:5rem;">
              <div class="md-layout md-gutter ">
                <div class="md-layout-item md-size-10 md-xsmall-size-35">
                  <md-button
                    @click="goToStep('second', 'first')"
                    class="md-theme-default md-button_prev">
                    Previous
                  </md-button>
                </div>
                <div class="md-layout-item md-size-80 md-small-size-70 md-xsmall-size-30">
                </div>
                <div class="md-layout-item md-size-10 md-small-size-20 md-xsmall-size-35">
                  <md-button
                    @click="goToStep('second', 'third')"
                    class="md-theme-default md-button_next">
                    Next
                  </md-button>
                </div>
              </div>
            </md-card-actions>
            <div class="u_width--max u_height--max">
              <div v-if="invalid['second'] && !secondPageFilled" class="md-error" style="color:red; text-align: right">
                Check for errors in required fields
              </div>
            </div>
            </div>
          </md-step>

          <md-step id="third" md-label="Confirm and Submit">
            <md-card-header>
              <md-card-header-text>
                <div class="md-title">Form Results</div>
                <div class="md-subhead" v-if="dataset.depiction">Cover Image: {{dataset.depiction.name}}</div>
              </md-card-header-text>

              <md-card-media md-big v-show="dataset.depiction" style="height:0px">
                <span id="depictWrapperMini" style="visibility: hidden">
                    <figure>
                      <img id="depictImgMini" src="" alt="Image preview...">
                    </figure>
                  </span>
              </md-card-media>
            </md-card-header>
            <md-card-content>
              <div class="u_margin-bottom-small"><h3>Title:</h3> {{ dataset.title }} </div>
              <div v-if="dataset.refby" class="u_margin-bottom-small"><h3>DOI:</h3> {{dataset.refby}} </div>
              <div v-if="dataset.contactPoint['@id']" class="u_margin-bottom-small">
                <h3>Contact Point:</h3>
                {{dataset.contactPoint['cpFirstName']}} {{dataset.contactPoint['cpLastName']}},
                {{dataset.contactPoint['cpEmail']}}
              </div>
              <div class="u_margin-bottom-small">
              <h3>Selected files: </h3>
                <div v-for="(file, index) in dataset.distrFiles" :key="index">
                {{file.file.name}}
                </div>
              </div>
              <div class="u_margin-bottom-small"><h3>Description:</h3> {{dataset.description}}</div>
              <div v-if="dataset.datePub['@value']" class="u_margin-bottom-small"><h3>Date published:</h3> {{dataset.datePub['@value']}}</div>
            </md-card-content>
            <md-card-actions>
              <md-button class="md-primary" @click="submitForm">Submit</md-button>
            </md-card-actions>
          </md-step>
        </md-steppers>
        </form>
      </md-card>
    </div>
    </div>
  </div>
</div>    
<dialogbox :active="dialogBoxActive" :minWidth="dialog.minWidth" :disableClose="dialog.disableClose">
  <template v-slot:title>{{dialog.title}}</template>
  <template v-slot:content>
    <div v-if="dialog.type=='loading' && uploadInProgress">
      <spinner :text="uploadInProgress"/>
    </div>
    <div v-if="dialog.type=='success'">
      New dataset created with ID {{generatedUUID}}
    </div>
  </template>
  <template v-slot:actions>
    <div v-if="dialog.type=='success'">
      <!--TODO: re-route to dataset page on click-->
      <md-button>OK</md-button>
    </div>
  </template>
</dialogbox>
</div>
</template>

<script>
import FileDrop from '@/components/curate/FileDrop.vue'
import FilePreview from '@/components/curate/FilePreview.vue'
import Dialog from '@/components/Dialog.vue'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
import Spinner from '@/components/Spinner.vue'
import useFileList from '@/modules/file-list'
import { saveDataset, isValidOrcid } from '@/modules/whyis-dataset'
import { mapGetters, mapMutations } from 'vuex'
const { v4: uuidv4 } = require('uuid')
const datasetId = uuidv4()
const distrFn = useFileList()

export default {
  name: 'SDDHome',
  components: {
    FileInput: FileDrop,
    FilePreview,
    dialogbox: Dialog,
    Spinner,
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
      invalid: {
        first: null,
        second: null,
        orcid: false
      },
      generatedUUID: datasetId,
      doi: '',
      dataset: {
        '@type': 'http://www.w3.org/ns/dcat#Dataset',
        // Dataset info: Step 1
        refby: '',
        distrFiles: distrFn.files,
        depiction: null,
        // Dataset info: Step 2
        title: '',
        contactPoint: {
          '@type': 'schemaPerson',
          '@id': null,
          cpFirstName: '',
          cpLastName: '',
          cpEmail: ''
        },
        description: '',
        contributors: [],
        datePub: {
          '@type': 'date',
          '@value': ''
        }
      },
      dialog: {
        title: '',
        type: null,
        size: 60,
        disableClose: false
      },
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox',
      doiData: 'explorer/curation/getDoiData',
      orcidData: 'explorer/curation/getOrcidData'
    }),
    secondPageFilled () {
      return !!this.dataset.title && !!this.dataset.contactPoint['@id'] &&
      !!this.dataset.contactPoint.cpFirstName && !!this.dataset.contactPoint.cpLastName &&
      !!this.dataset.contactPoint.cpEmail && !!this.dataset.description &&
      !this.invalid.orcid
    }
  },
  watch: {
    doiData () {
      this.dataset.refby = this.doiData?.URL
      this.dataset.title = this.doiData?.title[0] ?? this.dataset.title
      if (this.doiData?.published?.['date-parts'].flat().length === 3) {
        const dateArray = this.doiData.published['date-parts'].flat()
        this.dataset.datePub['@value'] = dateArray[0].toString() + '-' +
          (dateArray[1] < 10 ? '0' + dateArray[1].toString() : dateArray[1].toString()) + '-' +
          (dateArray[2] < 10 ? '0' + dateArray[2].toString() : dateArray[2].toString())
      }
      // TODO: contributors
    },
    orcidData (newValue, oldValue) {
      if (newValue === 'invalid') {
        this.invalid.orcid = true
      } else {
        this.invalid.orcid = false
        this.dataset.contactPoint.cpFirstName = this.orcidData?.['http://schema.org/givenName'][0]?.['@value']
        this.dataset.contactPoint.cpLastName = this.orcidData?.['http://schema.org/familyName'][0]?.['@value']
      }
    }
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox',
      setSnackbar: 'setSnackbar',
      clearSnackbar: 'resetSnackbar'
    }),
    addDistr: distrFn.addFiles,
    removeDistr: distrFn.removeFile,
    modStatDistr: distrFn.modifyStatus,
    navBack () {
      this.$router.back()
    },
    onInputChange (e) {
      this.addDistr(e.target.files)
      e.target.value = null
      this.invalid.first = null
    },
    goToStep (id, index) {
      this.clearSnackbar()
      if (id === 'first' && !this.dataset.distrFiles.length) {
        this.invalid.first = 'Missing required field'
      } else if (id === 'second' && !this.secondPageFilled) {
        this.invalid.second = 'Missing required field'
      } else {
        // Clear invalid errors
        (id === 'first') && (this.invalid.first = null);
        (id === 'second') && (this.invalid.second = null)
        this[id] = true
        if (index) {
          this.active = index
        }
      }
    },
    async lookupOrcid (e) {
      if (isValidOrcid(e.target.value)) {
        this.invalid.orcid = false
        await this.$store.dispatch('explorer/curation/lookupOrcid', e.target.value)
      } else {
        this.invalid.orcid = true
      }
    },
    async lookupDoi (e) {
      await this.$store.dispatch('explorer/curation/lookupDoi', e.target.value)
    },
    // Load a thumbnail of the representative image
    previewFile () {
      const preview = document.querySelector('#depictImg')
      const wrapper = document.querySelector('#depictWrapper')
      const previewMini = document.querySelector('#depictImgMini')
      const wrapperMini = document.querySelector('#depictWrapperMini')
      const file = document.querySelector('#file-depict-input').files[0]
      const reader = new FileReader()
      this.dataset.depiction = file

      reader.addEventListener('load', function () {
        wrapper.style.visibility = wrapperMini.style.visibility = 'visible'
        preview.src = previewMini.src = reader.result
      }, false)

      if (file) {
        reader.readAsDataURL(file)
      }
    },
    removeImage () {
      document.querySelector('#depictWrapper').style.visibility = 'hidden'
      document.querySelector('#file-depict-input').value = ''
      document.querySelector('#depictImg').src = ''
      this.dataset.depiction = null
    },
    renderDialog (title, type, minWidth, disableClose = false) {
      this.dialog = {
        title,
        type,
        minWidth,
        disableClose
      }
      this.toggleDialogBox()
    },
    // Submit and post as nanopublication
    async submitForm () {
      this.uploadInProgress = 'Uploading files'
      this.renderDialog('Submitting dataset', 'loading', 40, true)
      this.clearSnackbar()
      if (!this.dataset.distrFiles.length || !this.secondPageFilled) {
        this.setSnackbar({
          message: 'Unable to submit, check for required fields'
        })
        this.toggleDialogBox()
        this.invalid.first = !this.dataset.distrFiles.length ? 'Missing required field' : null
        this.invalid.second = !this.secondPageFilled ? 'Missing required field' : null
      } else {
        try {
          await saveDataset(this.dataset, this.dataset.distrFiles, this.dataset.depiction, this.generatedUUID)
          this.dialog.title = "Upload successful"
          this.dialog.type = "success"
          // TODO: Decide where routing should go to
          // .then(() => goToView(this.dataset.uri, "view"));
        } catch (err) {
          this.toggleDialogBox()
          this.setSnackbar({ message: err.response ?? err })
        }
      }
    }

  }
}
</script>
