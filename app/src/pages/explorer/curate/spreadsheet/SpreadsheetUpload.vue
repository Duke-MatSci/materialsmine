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
            <div><a>Click here</a> to download the template spreadsheet, and fill it out with your data.</div>
            <div>Skip this step if you have already downloaded the template spreadsheet.</div>
            <a @click="setDone('first', 'second')">Continue</a>
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
                  <button type="submit" id="clear-files-btn"
                    class="md-layout-item md-size-40 btn--tertiary btn btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                    @click="clearAllSpreadsheet">
                    Clear Files
                  </button>
                  <button type="submit" class="md-layout-item md-size-40 btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                    @click="setDone('second', 'third')">
                    Continue
                  </button>
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
                        <input type="file" id="file-supp-input" multiple @change="onInputChange" accept=".jpg, .png"/>
                    </div>
                </label>
            </DropZone>

            <div class="md-layout" v-show="suppFiles.length">
              <md-list class="md-layout utility-transparentbg md-theme-default">
                <FilePreview v-for="file in suppFiles" :key="file.id" :file="file" tag="div" classname="md-layout-item" @remove="removeSupp" />
              </md-list>
            </div>
            <div class="md-layout">
                  <button type="submit" id="clear-files-btn"
                    class="md-layout-item md-size-40 btn--tertiary btn btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                    @click="clearAllSupp">
                    Clear Files
                  </button>
                  <button type="submit" class="md-layout-item md-size-40 btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                    @click="setDone('third', 'fourth')">
                    Continue
                  </button>
                </div>
          </md-step>
          <md-step id="fourth" md-label="Verify data">
            User verifies data here
                <a @click="setDone('fourth', 'fifth')">Continue</a>
          </md-step>
          <md-step id="fifth" md-label="Confirm and submit">
            User confirms submission
            <a>Complete</a>
          </md-step>
        </md-steppers>
      </div>
    </div>
  </div>
</div>
</div>
</template>

<script>
import DropZone from '@/components/curate/FileDrop.vue'
import FilePreview from '@/components/curate/FilePreview.vue'
import LoginRequired from '@/components/LoginRequired.vue'
import useFileList from '@/modules/file-list'
import { VERIFY_AUTH_QUERY, CREATE_DATASET_ID_MUTATION, CREATE_DATASET_MUTATION } from '@/modules/gql/dataset-gql'
import { mapGetters } from 'vuex'

//Create separate file objects for spreadsheet vs supplementary files
const spreadsheetFn = useFileList()
const suppFn = useFileList()

export default {
  name: 'SpreadsheetHome',
  components: {
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
      fifth: false
    }
  },
  computed: {
    ...mapGetters({
      userId: 'auth/userId',
      isAuthenticated: 'auth/isAuthenticated', 
    })
  },
  methods: {
    addSpreadsheet: spreadsheetFn.addFiles,
    removeSpreadsheet: spreadsheetFn.removeFile,
    clearAllSpreadsheet: spreadsheetFn.clearAllFiles,
    addSupp: suppFn.addFiles,
    removeSupp: suppFn.removeFile,
    clearAllSupp: suppFn.clearAllFiles,
    async createDatasetId(){
      await this.$apollo.mutate({
        mutation: CREATE_DATASET_ID_MUTATION,
      }).then((data) => {
        this.datasetId = data
      }).catch((error) => {
        console.error("error:", error)
      })
    },
    async createDataset(){
      await this.$apollo.mutate({
        mutation: CREATE_DATASET_MUTATION,
        variables: {
          // TODO: input doesn't currently work
          input: {
            "datasetId":`${this.datasetId}`,
            "files": [...this.spreadsheetFiles, ...this.suppFiles],
          }
        }
      }).then((data) => {
        console.log("data:", data)
      }).catch((error) => {
        console.error("error:", error)
      })
    },
    onInputChange (e) {
      if (e.target.id=='file-spreadsheet-input') {
        this.addSpreadsheet(e.target.files)
      } else {
        this.addSupp(e.target.files)
      }
      e.target.value = null // reset so that selecting the same file again will still cause it to fire this change
    },
    setDone (id, index) {
      this[id] = true
      if (index) {
        this.active = index
      }
    },
    async navBack () {
      this.$router.back()
    }
  },
  apollo: {
    verifyUser: {
      query: VERIFY_AUTH_QUERY,
      fetchPolicy: 'cache-and-network'
    },
  }
}
</script>
