<template>
<div>
<div class="section_teams">
  <div
      v-if="!loading"
  >
    <CurateNavBar active="New Spreadsheet" :routes="routes"/>
  </div>
  <div class="curate">
    <div>
      <LoginReq v-if="!auth"/>
      <div v-else>
        <h2 class="visualize_header-h1">Import spreadsheet data </h2>
        <div v-if="datasetId" class="md-layout md-alignment-center-left" style="margin: 0rem 1rem">
          <span>
            Uploading to dataset ID
            <a @click="renderDialog('Use a different ID?', 'datasetId', 80)">{{datasetId}}</a>
          </span>
          <md-button id="editId" class="md-icon-button"
            @click="renderDialog('Use a different ID?', 'datasetId', 80)"
          >
            <md-icon>edit</md-icon>
          </md-button>
        </div>
        <div v-else> No dataset ID selected.
          <a @click="renderDialog('Use a different ID?', 'datasetId', 80)">Select an existing ID</a>
          , or return to the <a @click="navBack">previous page?</a>
        </div>
        <md-steppers md-vertical md-linear :md-active-step.sync="active" class="form__stepper">
          <md-step id="first" md-label="Download blank template" :md-done.sync="first">
            <div class="utility-line-height-sm"><a>Click here</a> to download the template spreadsheet, and fill it out with your data.</div>
            <div class="utility-line-height-sm">To curate FEA data, <a>click here</a> instead.</div>

            <div style="utility-line-height-sm">Skip this step if you have already downloaded the template spreadsheet.</div>
            <md-button type="submit" class="md-button_next"
              @click="goToStep('first', 'second')">
              Next
            </md-button>
          </md-step>
          <md-step id="second" md-label="Select spreadsheet for upload" :md-done.sync="second">
            <DropZone class="form__drop-area" @files-dropped="addSpreadsheet">
                <label for="file-spreadsheet-input">
                    <div class="form__drop-area_label">
                        <div class="explorer_page-nav-card_text">Drag the completed spreadsheet here </div>
                        <div class="md-layout-item_para md-layout-item_para_fl" style="text-align:center">
                            or click to browse. Accepts .xlsx
                        </div>
                        <input type="file" id="file-spreadsheet-input" multiple @change="onInputChange" accept=".xlsx"/>
                    </div>
                </label>
            </DropZone>

            <div class="md-layout" v-show="spreadsheetFiles.length">
              <md-list class="md-layout utility-transparentbg md-theme-default">
                <FilePreview v-for="file in spreadsheetFiles" :key="file.id" :file="file" tag="div" classname="md-layout-item" @remove="removeSpreadsheet" />
              </md-list>
            </div>
            <div class="md-layout">
                  <md-button type="submit" class="md-layout-item md-button_prev md-size-40"
                    @click="goToStep('second', 'first')">
                    <md-icon>arrow_back</md-icon>Go Back
                  </md-button>
                  <md-button type="submit" :disabled="spreadsheetFiles.length < 1" class="md-layout-item md-button_next md-size-40"
                    @click="goToStep('second', 'third')">
                    Next<md-icon>arrow_forward</md-icon>
                  </md-button>
                </div>
          </md-step>
          <md-step id="third" md-label="Select supplementary files for upload" :md-done.sync="third">
            <DropZone class="form__drop-area" @files-dropped="addSupp">
                <label for="file-supp-input">
                    <div class="form__drop-area_label">
                        <div class="explorer_page-nav-card_text">Add supplementary images and raw data files here </div>
                        <div class="md-layout-item_para md-layout-item_para_fl" style="text-align:center">
                            or click to browse.
                        </div>
                        <input type="file" id="file-supp-input" multiple @change="onInputChange" accept=".jpg, .jpeg, .png, .csv, .xls"/>
                    </div>
                </label>
            </DropZone>
            <!--TODO:  Need to convert tif files, redirect to converter (add step) and allow to download-->
            <div v-if="false"></div>

            <div class="md-layout" v-show="suppFiles.length">
              <md-list class="md-layout utility-transparentbg md-theme-default">
                <FilePreview v-for="file in suppFiles" :key="file.id" :file="file" tag="div" classname="md-layout-item" @remove="removeSupp" />
              </md-list>
            </div>
            <div class="md-layout">
                  <md-button type="submit" class="md-layout-item md-button_prev md-size-40"
                    @click="goToStep('third', 'second')">
                    <md-icon>arrow_back</md-icon>Go Back
                  </md-button>
                  <md-button type="submit" class="md-layout-item md-button_next md-size-40"
                    @click="goToStep('third', 'fourth')">
                    Next<md-icon>arrow_forward</md-icon>
                  </md-button>
                </div>
          </md-step>
          <md-step id="fourth" md-label="Additional Information" :md-done.sync="fourth">
            <div v-if="datasetId" class="md-layout md-alignment-center-left" style="margin: 0rem 1rem">
                <span>
                  Uploading to dataset ID
                  <a @click="renderDialog('Use a different ID?', 'datasetId', 80)">{{datasetId}}</a>
                </span>
                <md-button id="editId" class="md-icon-button"
                  @click="renderDialog('Use a different ID?', 'datasetId', 80)"
                >
                  <md-icon>edit</md-icon>
                </md-button>
            </div>
            <div v-else> No dataset ID selected.
              <a @click="renderDialog('Use a different ID?', 'datasetId', 80)">Select an existing ID</a>
              , or <a @click="navBack">exit the form?</a>
            </div>
            <md-field :class="{ 'md-invalid': isInvalidForm }" style="max-width: 80%; margin: 1rem" >
              <label>Title</label>
              <md-input v-model="title" required></md-input>
              <span class="md-error">Title required</span>
              <span class="md-helper-text">Create a title for your new dataset</span>
            </md-field>
            <div style="max-width: 80%; margin: 1rem" >&nbsp;</div>
            <md-field style="max-width: 80%; margin: 1rem">
              <label>DOI</label>
              <md-input v-model="doi"></md-input>
              <span class="md-helper-text">Enter the DOI of related publication if exists (e.g., 10.1000/000)</span>
            </md-field>
            <div class="md-layout">
              <md-button type="submit" class="md-layout-item md-button_prev md-size-40"
                @click="goToStep('fourth', 'third')">
                <md-icon>arrow_back</md-icon>Go Back
              </md-button>
              <md-button type="submit" class="md-layout-item md-button_next md-size-40"
                @click="goToStep('fourth', 'sixth')">
                Next<md-icon>arrow_forward</md-icon>
              </md-button>
            </div>
          </md-step>
          <md-step :md-editable="false" id="fifth" md-label="Verify data">
            Verification step - Coming soon.
            <div class="md-layout">
                  <md-button type="submit" class="md-layout-item md-button_prev md-size-40"
                    @click="goToStep('third', 'fourth')">
                    <md-icon>arrow_back</md-icon>Go Back
                  </md-button>
                  <md-button type="submit" class="md-layout-item md-button_next md-size-40"
                    @click="goToStep('fourth', 'sixth')">
                    Next<md-icon>arrow_forward</md-icon>
                  </md-button>
            </div>
          </md-step>
          <md-step id="sixth" md-label="Confirm and submit">
            <h3>Title:</h3>  {{title}}
            <div>&nbsp;</div>
            <h3>DOI:</h3>
             {{doi}}
            <div>&nbsp;</div>
            <h3>Uploaded files: </h3>

            <h4 style="margin-top:1rem;">Spreadsheet(s)</h4>
            <ul style="margin-left:1rem;">
              <div v-for="(ss, index) in spreadsheetFiles" :key="index">
                {{ss.file.name}}
              </div>
            </ul>

            <h4 style="margin-top:1rem;">Supplementary files</h4>
            <ul style="margin-left:1rem;">
              <div v-for="(suppl, index) in suppFiles" :key="index">
                {{suppl.file.name}}
              </div>
            </ul>

            <div style="color: red; margin-top:2rem" v-if="spreadsheetFiles.length < 1 || isInvalidForm">Title and at least one spreadsheet are required for submission.</div>
            <div class="md-layout">
                  <md-button type="submit" class="md-layout-item md-button_prev md-size-40"
                    @click="goToStep('sixth', 'fourth')">
                    <md-icon>arrow_back</md-icon>Go Back
                  </md-button>
                <md-button type="submit" :disabled="(spreadsheetFiles.length < 1) || isInvalidForm" class="md-layout-item md-button_next md-size-40"
                  @click="renderDialog('Submit files?', 'submit', 40)">
                  Save and Submit
                </md-button>
            </div>
          </md-step>
        </md-steppers>
      </div>
    </div>
  </div>
</div>
<dialogbox :active="dialogBoxActive" :minWidth="dialog.minWidth" :disableClose="dialog.disableClose">
    <template v-slot:title>{{dialog.title}}</template>
    <template v-slot:content>
      <div v-if="dialog.type=='submit'">
        You are submitting {{spreadsheetFiles.length}}
        spreadsheet<span v-if="spreadsheetFiles.length!=1">s</span>
        and {{suppFiles.length}}
        supplementary file<span v-if="suppFiles.length!=1">s</span>.
      </div>
      <div v-if="dialog.type=='datasetId'">
        <div v-if="datasetId"> You are using dataset ID <b>{{datasetId}}</b>.</div>
        <div> To use a pre-existing ID, select from the following: </div>
        <md-autocomplete
          v-model="selectedDataset.label"
          @md-selected="changeSelectedDataset"
          :md-options="getUserDataset.datasets"
          :md-open-on-focus="true">
          <label>Dataset ID</label>
          <template style="max-width: 90%;" slot="md-autocomplete-item" slot-scope="{ item }">
            <div style="width:100%">
              <div style="width: 90%;
                          overflow: hidden;
                          -o-text-overflow: ellipsis;
                          text-overflow: ellipsis;">
                <b>{{ item.title || `${item.datasetGroupId} (Untitled)`}} &nbsp;</b>
              </div>
              <span>
                <i>last updated {{(new Date(parseInt(item.updatedAt))).toLocaleString()}}</i>
              </span>
            </div>
          </template>

          <template style="max-width: 90%;" slot="md-autocomplete-empty" slot-scope="{ term }">
            <p>No dataset IDs matching "{{ term }}" were found.</p>
          </template>
        </md-autocomplete>
      </div>
      <div v-if="dialog.type=='loading' && uploadInProgress">
        <spinner :text="uploadInProgress"/>
      </div>
    </template>
    <template v-slot:actions>
      <div v-if="dialog.type=='datasetId'">
        <div class="">
        <md-button type="submit" class="md-button-transparent"
          @click="toggleDialogBox()">
          Cancel
        </md-button>
        <md-button type="submit" class="md-button-transparent"
          @click="toggleDialogBox();changeDatasetId()">
          Confirm dataset ID change
        </md-button>
        </div>
      </div>
      <div v-else-if="dialog.type=='submit'">
        <md-button type="submit" class="md-button-transparent"
          @click="toggleDialogBox()">
          No, continue editing
        </md-button>
        <md-button type="submit" class="md-button-transparent"
          @click="submitFiles()">
          Yes, submit
        </md-button>
      </div>
    </template>
</dialogbox>
</div>
</template>

<script>
import DropZone from '@/components/curate/FileDrop.vue'
import FilePreview from '@/components/curate/FilePreview.vue'
import LoginRequired from '@/components/LoginRequired.vue'
import Dialog from '@/components/Dialog.vue'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
import Spinner from '@/components/Spinner.vue'
import useFileList from '@/modules/file-list'
import { VERIFY_AUTH_QUERY, USER_DATASET_IDS_QUERY, CREATE_DATASET_MUTATION } from '@/modules/gql/dataset-gql'
import { mapGetters, mapMutations } from 'vuex'

// Create separate file objects for spreadsheet vs supplementary files
const spreadsheetFn = useFileList()
const suppFn = useFileList()

export default {
  name: 'SpreadsheetHome',
  components: {
    dialogbox: Dialog,
    DropZone,
    FilePreview,
    CurateNavBar,
    Spinner,
    LoginReq: LoginRequired
  },
  data () {
    return {
      auth: true,
      verifyUser: null,
      loading: false,
      uploadInProgress: true,
      selectedDataset: {
        label: '',
        id: null
      },
      spreadsheetFiles: spreadsheetFn.files,
      suppFiles: suppFn.files,
      uploadedFiles: null,
      title: null,
      doi: null,
      active: 'first',
      first: false,
      second: false,
      third: false,
      fourth: false,
      fifth: false,
      sixth: false,
      isInvalidForm: false,
      dialog: {
        title: '',
        type: null,
        size: 60,
        disableClose: false
      },
      routes: [
        {
          label: 'Curate',
          path: '/explorer/curate'
        },
        {
          label: 'Spreadsheet',
          path: '/explorer/curate/spreadsheet'
        }
      ]
    }
  },
  props: {
    datasetId: {
      type: String
    }
  },
  computed: {
    ...mapGetters({
      userId: 'auth/userId',
      isAuthenticated: 'auth/isAuthenticated',
      dialogBoxActive: 'dialogBox'
    })
  },
  methods: {
    addSpreadsheet: spreadsheetFn.addFiles,
    removeSpreadsheet: spreadsheetFn.removeFile,
    modStatSpreadsheet: spreadsheetFn.modifyStatus,
    addSupp: suppFn.addFiles,
    removeSupp: suppFn.removeFile,
    modStatSupp: suppFn.modifyStatus,
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    async navBack () {
      this.$router.back()
    },
    async createDataset () {
      await this.$apollo.mutate({
        mutation: CREATE_DATASET_MUTATION,
        variables: {
          input: {
            datasetId: `${this.datasetId}`,
            files: this.uploadedFiles.files,
            title: this.title,
            doi: this.doi
          }
        }
      }).then((data) => {
        console.log('data:', data)
      }).catch((error) => {
        console.error('error:', error)
      })
    },
    // Format files for submission
    processFiles () {
      var incompleteFiles = this.spreadsheetFiles.filter(file => file.status === 'incomplete')
        .concat(this.suppFiles.filter(file => file.status === 'incomplete'))
      return incompleteFiles.map(({ file }) => file)
    },
    onInputChange (e) {
      if (e.target.id === 'file-spreadsheet-input') {
        this.addSpreadsheet(e.target.files)
      } else {
        this.addSupp(e.target.files)
      }
      // reset so that selecting the same file again will still cause it to fire this change
      e.target.value = null
    },
    goToStep (id, index) {
      if (id === 'fourth' && index === 'sixth') {
        if (!this.title) {
          this.isInvalidForm = true
          return
        } else this.isInvalidForm = false
      }
      this[id] = true
      if (index) {
        this.active = index
      }
    },
    async submitFiles () {
      this.toggleDialogBox()
      this.uploadInProgress = 'Uploading files'
      this.renderDialog('Submitting dataset', 'loading', 40, true)
      await this.uploadFiles()
        .then(() => {
          this.uploadInProgress = 'Creating dataset'
          this.createDataset()
          setTimeout(() => {
            this.toggleDialogBox()
            this.uploadInProgress = false
            this.$router.push({ name: 'DatasetSingleView', params: { id: `${this.datasetId}` } })
          }, 1000)
        })
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
    async uploadFiles () {
      const url = '/api/files/upload'
      const formData = new FormData()
      const files = this.processFiles()
      files.forEach((file) => formData.append('uploadfile', file))
      await fetch(url, {
        method: 'POST',
        body: formData,
        redirect: 'follow'
      })
        .then(response => response.json())
        .then(result => {
          this.uploadedFiles = result
          this.spreadsheetFiles.forEach((file, index) => this.modStatSpreadsheet(index, 'complete'))
          this.suppFiles.forEach((file, index) => this.modStatSupp(index, 'complete'))
        })
        .catch(error => console.log('error', error))
    },
    changeSelectedDataset (selection) {
      this.selectedDataset.label = selection.title || `${selection.datasetGroupId} (Untitled)`
      this.selectedDataset.id = selection.datasetGroupId
    },
    changeDatasetId () {
      this.$router.replace({ name: 'CurateSpreadsheet', params: { datasetId: this.selectedDataset.id } })
    }
  },
  apollo: {
    verifyUser: {
      query: VERIFY_AUTH_QUERY,
      fetchPolicy: 'cache-and-network'
    },
    getUserDataset: {
      query: USER_DATASET_IDS_QUERY,
      fetchPolicy: 'cache-and-network'
    }
  }
}
</script>
