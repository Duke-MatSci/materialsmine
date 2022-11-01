<template>
<div>
<div class="section_teams">
  <div
      v-if="!loading"
  >
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
      <router-link to="/explorer/curate/new" v-slot="{navigate, href}" custom>
        <a :href="href" @click="navigate">
            <md-tooltip md-direction="bottom">
            Select curation method
            </md-tooltip>
            Method
        </a>
      </router-link>
      <span class="md-icon-button"> > </span>
      <span class="md-icon-button"> Spreadsheet </span>
    </div>
  </div>
  <div class="curate">
    <div>
      <LoginReq v-if="!auth"/>
      <div v-else>
        <h2 class="visualize_header-h1">Import spreadsheet data </h2>
        <md-steppers md-vertical md-linear :md-active-step.sync="active" class="form__stepper">
          <md-step id="first" md-label="Download blank template" :md-done.sync="first">
            <div style="font-size:16px; line-height:3;"><a>Click here</a> to download the template spreadsheet, and fill it out with your data.</div>
            <div style="font-size:16px;">Skip this step if you have already downloaded the template spreadsheet.</div>
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
                  <md-button type="submit" class="md-layout-item md-button_next md-size-40"
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
                        <input type="file" id="file-supp-input" multiple @change="onInputChange" accept=".jpg, .png, .csv, .tif"/>
                    </div>
                </label>
            </DropZone>

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
                    @click="goToStep('third', 'fifth')">
                    Next<md-icon>arrow_forward</md-icon>
                  </md-button>
                </div>
          </md-step>
          <md-step disabled id="fourth" md-label="Verify data">
            Verification step - Work in progress
            <div class="md-layout">
                  <md-button type="submit" class="md-layout-item md-button_prev md-size-40"
                    @click="goToStep('fifth', 'third')">
                    <md-icon>arrow_back</md-icon>Go Back
                  </md-button>
                  <md-button type="submit" class="md-layout-item md-button_next md-size-40"
                    @click="goToStep('third', 'fifth')">
                    Next<md-icon>arrow_forward</md-icon>
                  </md-button>
            </div>
          </md-step>
          <md-step id="fifth" md-label="Confirm and submit">
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
            <div class="md-layout">
                  <md-button type="submit" class="md-layout-item md-button_prev md-size-40"
                    @click="goToStep('fifth', 'third')">
                    <md-icon>arrow_back</md-icon>Go Back
                  </md-button>
                <md-button type="submit" class="md-layout-item md-button_next md-size-40"
                  @click="toggleDialogBox()">
                  Save and Complete
                </md-button>
            </div>
          </md-step>
        </md-steppers>
      </div>
    </div>
  </div>
</div>
<dialogbox :active="dialogBoxActive" :minWidth="dialog.minWidth">
    <template v-slot:title>Submit files?</template>
    <template v-slot:content>
        You are submitting {{spreadsheetFiles.length}}
        spreadsheet<span v-if="spreadsheetFiles.length!=1">s</span>
        and {{suppFiles.length}}
        supplementary file<span v-if="suppFiles.length!=1">s</span>.
    </template>
    <template v-slot:actions>
        <md-button type="submit" class="md-layout-item md-button_prev md-size-40"
          @click="toggleDialogBox()">
          No, continue editing
        </md-button>
        <md-button type="submit" class="md-layout-item md-button_next md-size-40"
          @click="toggleDialogBox()">
          Yes, submit
        </md-button>
    </template>
</dialogbox>
</div>
</template>

<script>
import DropZone from '@/components/curate/FileDrop.vue'
import FilePreview from '@/components/curate/FilePreview.vue'
import LoginRequired from '@/components/LoginRequired.vue'
import Dialog from '@/components/Dialog.vue'
import useFileList from '@/modules/file-list'
import { VERIFY_AUTH_QUERY, CREATE_DATASET_ID_MUTATION, CREATE_DATASET_MUTATION } from '@/modules/gql/dataset-gql'
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
    LoginReq: LoginRequired
  },
  data () {
    return {
      auth: true,
      verifyUser: null,
      loading: false,
      datasetId: null,
      spreadsheetFiles: spreadsheetFn.files,
      suppFiles: suppFn.files,
      active: 'first',
      first: false,
      second: false,
      third: false,
      fourth: false,
      fifth: false,
      dialog: {
        title: 'Submit files?',
        minWidth: 60
      }
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
    clearAllSpreadsheet: spreadsheetFn.clearAllFiles,
    addSupp: suppFn.addFiles,
    removeSupp: suppFn.removeFile,
    clearAllSupp: suppFn.clearAllFiles,
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    async createNewDatasetId () {
      await this.$apollo.mutate({
        mutation: CREATE_DATASET_ID_MUTATION
      }).then((result) => {
        this.datasetId = result.data.createDatasetId.datasetGroupId
      }).catch((error) => {
        console.error('error:', error)
        if (error.message.includes('unused')) {
          this.datasetId = error.message.split('-')[1]?.split(' ')[1]
        }
      })
    },
    async createDataset () {
      const fileArray = this.processFiles()
      await this.$apollo.mutate({
        mutation: CREATE_DATASET_MUTATION,
        variables: {
          input: {
            datasetId: `${this.datasetId}`,
            files: fileArray
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
      // TODO: Reformat to match the required input for createDataset
      // Add the supplementary files
      var result = this.spreadsheetFiles.map(file => ({ filename: file.file.name, contentType: file.file.type }))
      return result
    },
    onInputChange (e) {
      if (e.target.id === 'file-spreadsheet-input') {
        this.addSpreadsheet(e.target.files)
      } else {
        this.addSupp(e.target.files)
      }
      e.target.value = null // reset so that selecting the same file again will still cause it to fire this change
    },
    goToStep (id, index) {
      this[id] = true
      if (index) {
        this.active = index
      }
    },
    async navBack () {
      this.$router.back()
    }
  },
  mounted () {
    if (this.isAuthenticated) {
      this.createNewDatasetId()
    }
  },
  apollo: {
    verifyUser: {
      query: VERIFY_AUTH_QUERY,
      fetchPolicy: 'cache-and-network'
    }
  }
}
</script>
