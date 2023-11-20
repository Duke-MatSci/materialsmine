<template>
<div>
    <div class="section_teams form__stepper">
        <div>
        <CurateNavBar active="New Bulk Upload" :navRoutes="navRoutes"/>
        </div>
        <div class="curate">
            <LoginReq v-if="!auth"/>
            <div v-else-if="submitted">
              <h2 class="visualize_header-h1 u_margin-top-small u_centralize_text"> Curation Result(s) </h2>
              <div v-if="loading">
                <spinner text="Upload in progress"/>
              </div>
              <div v-else-if="!!xmlBulkResponse">
                <div v-if="!!xmlBulkResponse.bulkErrors" class="viz-u-mgup-sm utility-margin md-theme-default">
                  <md-list class="md-double-line" v-if="!!Object.keys(xmlBulkResponse.bulkErrors).length">
                  <div class="u_width--max md-content utility-roverflow">
                    <h2 class="md-title u--color-black" style="margin-bottom: .4rem;">
                      Errors
                    </h2>
                  </div>

                  <md-list class="md-dense md-double-line">
                    <div class="u_width--max u--margin-pos" v-for="(file, index) in xmlBulkResponse.bulkErrors" :key="index + '_err'">

                    <div class="u--font-emph-l" md-elevation="0">
                        <a :href="optionalChaining(() => file.filename)" download>
                          <span class="md-body-2 u--color-black">{{file.filename.split('/').pop()}}</span>
                        </a>
                    </div>

                    <md-divider></md-divider>

                    <div v-if="typeof file.errors === 'object'">
                      <li class="md-list-item md-inset" v-for="(error, index) in file.errors" :key='`${file}_${index}`'>
                        <div class="md-list-item-link md-list-item-container md-button-clean">
                        <div class="md-list-item-content md-list-item-content-reduce u--layout-flex-justify-fs md-ripple">
                            <div class="md-body-1 u--color-grey-sec">- {{ index }}: &nbsp; </div>
                            <div class="md-body-1 u--color-error">{{error}}</div>
                        </div>
                        </div>
                      </li>
                    </div>

                    <div v-else>
                      <li class="md-list-item md-inset">
                        <div class="md-list-item-link md-list-item-container md-button-clean">
                        <div class="md-list-item-content md-list-item-content-reduce u--layout-flex-justify-fs md-ripple">
                            <span class="md-body-1 u--color-grey-sec">- {{ file.errors }}</span>
                        </div>
                        </div>
                      </li>
                    </div>
                    </div>
                  </md-list>
                  </md-list>
                </div>
                <div v-if="!!xmlBulkResponse.bulkCurations">
                  <div class="u_width--max md-content utility-roverflow">
                    <h2 class="md-title u--color-black" style="margin-bottom: 1.4rem;">
                      Successful Curations
                    </h2>
                  </div>
                  <div v-if="!Object.keys(xmlBulkResponse.bulkCurations).length" class="u--margin-pos">No results received.</div>

                  <div v-else class="gallery-grid grid grid_col-4">
                    <md-card v-for="(xml, index) in xmlBulkResponse.bulkCurations" :key="index"
                       class="btn--animated gallery-item">
                      <router-link :to="{ name: 'XmlVisualizer', params: { id: xml.sampleID }, query: { isNewCuration: 'true' }}">
                        <md-card-media-cover md-solid>
                            <div class="utility-align--right">
                              <div> <p class="u--color-primary"> <strong>Status: </strong>{{ xml.status }}</p>
                              </div>
                              <div><p class="u--color-primary">
                                <strong>Admin approval: </strong>{{ xml.isApproved ? 'Approved' : 'Not approved' }}</p>
                              </div>
                            </div>
                            <md-card-media md-ratio="4:3">
                              <md-icon class="explorer_page-nav-card_icon u_margin-top-small">code_off</md-icon>
                            </md-card-media>

                            <md-card-area class="u_gridbg">
                              <md-card-header class="u_show_hide">
                                <span class="md-subheading">
                                <strong>{{ optionalChaining(() =>  xml.sampleID ) }}</strong>
                                </span>
                                <span class="md-body-1">Click to view</span>
                              </md-card-header>
                            </md-card-area>
                        </md-card-media-cover>
                      </router-link>
                    </md-card>
                  </div>
                </div>
              </div>
            </div>
            <div v-else>
              <h2 class="visualize_header-h1">Upload samples in bulk </h2>
              <md-steppers md-vertical md-linear :md-active-step.sync="active" class="form__stepper">
                <md-step id="first" md-label="Download blank template" :md-done.sync="first">
                <div class="utility-line-height-sm"><a href="/master_template.xlsx" download>
                    Click here</a> to download the template spreadsheet, and fill it out with your data.
                </div>

                <div class="utility-line-height-sm">Skip this step if you have already downloaded the template spreadsheet.</div>
                <md-button type="submit" class="md-button_next u--margin-toplg"
                    @click="goToStep('first', 'second')">
                    Next
                </md-button>
                </md-step>
                <md-step id="second" md-label="Select file for upload" :md-done.sync="second">
                <div style="margin:2rem 2rem 0; font-weight:600">
                    The template spreadsheet for each sample in the .zip file must
                    contain 'master_template.xlsx' in its name.
                </div>
                <div style="margin:0 2rem">
                    Only one .zip file can be processed at a time.
                </div>
                <DropZone class="form__drop-area" @files-dropped="addSpreadsheet">
                    <label for="file-spreadsheet-input">
                        <div class="form__drop-area_label">
                            <div class="explorer_page-nav-card_text">Drag the complete zipped folder here </div>
                            <div class="md-layout-item_para md-layout-item_para_fl" style="text-align:center">
                                or click to browse. Accepts .zip
                            </div>
                            <input type="file" id="file-spreadsheet-input" @change="onInputChange" accept="application/zip, .zip"/>
                        </div>
                    </label>
                </DropZone>

                <div class="md-layout" v-show="spreadsheetFiles.length">
                    <md-list class="md-layout utility-transparentbg md-theme-default">
                    <FilePreview v-for="file in spreadsheetFiles" :key="file.id" :file="file" tag="div" classname="md-layout-item" @remove="removeSpreadsheet" />
                    </md-list>
                </div>
                <div style="color: red; margin:2rem 2rem 0; font-weight:600" v-if="!!invalidFile">
                    {{invalidFile}}
                </div>
                <div class="md-layout">
                        <md-button type="submit" class="md-layout-item md-button_prev md-size-40"
                        @click="goToStep('second', 'first')">
                        <md-icon>arrow_back</md-icon>Go Back
                        </md-button>
                        <md-button type="submit" :disabled="spreadsheetFiles.length < 1"
                          class="md-layout-item md-button_next md-size-40"
                          @click="goToStep('second', 'third')">
                        Next<md-icon>arrow_forward</md-icon>
                        </md-button>
                    </div>
                </md-step>
                <md-step id="third" md-label="Confirm and submit" :md-done.sync="third">
                    <h3>Selected zip file:</h3>
                    <ul style="margin-left:1rem;">
                        <div v-for="(ss, index) in spreadsheetFiles" :key="index">
                        {{ss.file.name}}
                        </div>
                    </ul>
                    <div style="margin:2rem 0 2rem 0">
                        Please verify that every filled template spreadsheet in the .zip file
                        contains 'master_template' in its name.
                    </div>

                <div class="md-layout">
                        <md-button type="submit" class="md-layout-item md-button_prev md-size-40"
                        @click="goToStep('third', 'second')">
                        <md-icon>arrow_back</md-icon>Go Back
                        </md-button>
                    <md-button id="submit" type="submit" :disabled="(spreadsheetFiles.length < 1)" class="md-layout-item md-button_next md-size-40"
                        @click="submitFiles(); clearSnackbar()">
                        Save and Submit
                    </md-button>
                </div>
                </md-step>
            </md-steppers>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import DropZone from '@/components/curate/FileDrop.vue'
import FilePreview from '@/components/curate/FilePreview.vue'
import LoginRequired from '@/components/LoginRequired.vue'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
import Spinner from '@/components/Spinner.vue'
import useFileList from '@/modules/file-list'
import { VERIFY_AUTH_QUERY, USER_DATASET_IDS_QUERY } from '@/modules/gql/dataset-gql'
import { mapGetters, mapMutations, mapActions } from 'vuex'
import optionalChainingUtil from '@/mixins/optional-chaining-util'

// Create separate file objects for spreadsheet vs supplementary files
const spreadsheetFn = useFileList()

export default {
  name: 'SpreadsheetBulk',
  mixins: [optionalChainingUtil],
  components: {
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
      invalidFile: null,
      loading: true,
      submitted: false,
      selectedDataset: {
        label: '',
        id: null
      },
      spreadsheetFiles: spreadsheetFn.files,
      active: 'first',
      first: false,
      second: false,
      third: false,
      fourth: false,
      navRoutes: [
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
  computed: {
    ...mapGetters({
      userId: 'auth/userId',
      isAuthenticated: 'auth/isAuthenticated',
      token: 'auth/token',
      xmlBulkResponse: 'explorer/curation/getXmlBulkResponse'
    })
  },
  methods: {
    addSpreadsheet: spreadsheetFn.addFiles,
    removeSpreadsheet: spreadsheetFn.removeFile,
    modStatSpreadsheet: spreadsheetFn.modifyStatus,
    clearAllFiles: spreadsheetFn.clearAllFiles,
    ...mapActions({
      submitBulkXml: 'explorer/curation/submitBulkXml'
    }),
    ...mapMutations({
      clearSnackbar: 'resetSnackbar',
      setDatasetId: 'explorer/curation/setDatasetId'
    }),
    navBack () {
      this.$router.back()
    },
    // Format files for submission
    processFiles () {
      return this.spreadsheetFiles.filter(file => file.status === 'incomplete')
        .map(({ file }) => file)
    },
    onInputChange (e) {
      this.invalidFile = null
      const reg = /\.(zip)$/
      if (!reg.test(e.target.files[0].name)) {
        this.invalidFile = 'Only .zip files are accepted'
      } else if (this.spreadsheetFiles.length) {
        this.invalidFile = 'Only one .zip file can be uploaded at a time. Your previously selected file has been removed.'
        this.clearAllFiles()
        this.addSpreadsheet(e.target.files)
      } else this.addSpreadsheet(e.target.files)

      // reset so that selecting the same file again will still cause it to fire this change
      e.target.value = null
    },
    goToStep (id, index) {
      this.clearSnackbar()
      this[id] = true
      if (index) {
        this.active = index
      }
    },
    async submitFiles () {
      this.submitted = true
      this.loading = true
      const files = this.processFiles()
      try {
        await this.submitBulkXml(files)
        this.spreadsheetFiles.forEach((file, index) => this.modStatSpreadsheet(index, 'complete'))
        this.loading = false
        this.setDatasetId('')
        if (!this.$route?.query?.complete) this.$router.push({ query: { complete: 'true' } })
      } catch (error) {
        this.loading = false
        this.setDatasetId('')
        this.$store.commit('setSnackbar', {
          message: error
        })
      }
    }
  },
  mounted () {
    if (!!this.$route?.query?.complete && !!this.xmlBulkResponse) {
      this.submitted = true
      this.loading = false
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