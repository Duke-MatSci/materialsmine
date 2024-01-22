<template>
<div>
<div>
  <div>
    <CurateNavBar active="Direct Upload with SDD" :navRoutes="navRoutes"/>
  </div>
  <div class="curate">
    <div>
      <div class="section_loader" v-if="loading">
        <spinner :loading="loading" text='Loading Dataset'/>
      </div>
    <div v-else @click="disableDropdownRender">
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

            <div class="u--margin-posmd" v-show="(optionalChaining(() => distrFiles.length))">
              <h4 v-if="(optionalChaining(() => oldDistributions.length))">
                New file(s) to upload
              </h4>
              <div class="md-layout">
                <md-list class="md-layout utility-transparentbg md-theme-default">
                <FilePreview v-for="file in distrFiles" :key="file.id" :file="file"
                  tag="div" classname="md-layout-item" @remove="removeDistr" />
                </md-list>
              </div>
            </div>

            <md-divider v-if="((optionalChaining(() => distrFiles.length)) && (optionalChaining(() => oldDistributions.length)))"
              class="u_width--max" style="border-style: solid"></md-divider>

            <div class="u--margin-posmd" v-if="(optionalChaining(() => oldDistributions.length))">
              <h4>
                Previously uploaded file(s)
              </h4>
              <i> These files are already in MaterialsMine. You do not need to be re-upload them </i>
              <div class="md-layout">
                <md-list class="md-layout utility-transparentbg md-theme-default">
                <div v-for="file in oldDistributions" :key="`${file.uri}_old`" classname="md-layout-item">
                  <FilePreview :file="file" tag="div" :customActions="true" :showRemove="false">
                    <template #custom_actions>
                      <md-button id="downloadFile" class="md-icon-button" :href="(optionalChaining(() => file.uri))" download>
                        <md-tooltip> Download file </md-tooltip>
                        <md-icon>download</md-icon>
                      </md-button>
                      <md-button id="deleteFile" class="md-icon-button" @click.native.prevent="confirmDeletion(file)">
                        <md-tooltip> Delete file </md-tooltip>
                        <md-icon>delete</md-icon>
                      </md-button>
                    </template>
                  </FilePreview>
                </div>
                </md-list>
              </div>
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

            <div class="md-layout md-gutter u--margin-posmd">
              <span>
                <div class="u--margin-posmd u--margin-rightmd u--margin-leftsm" v-if="oldDepiction">
                  <h4 >
                    Previously uploaded thumbnail
                  </h4>
                  <figure>
                    <img v-if="oldDepiction.accessUrl" :src="oldDepiction.accessUrl" alt="Image preview..." style="height:150px">
                    <figcaption v-if="oldDepiction.status === 'delete'">Will be deleted when edits are submitted</figcaption>
                  </figure>
                  <md-button id="downloadFile" class="md-icon-button" :href="oldDepiction.accessUrl" download>
                    <md-tooltip> Download file </md-tooltip>
                    <md-icon>download</md-icon>
                  </md-button>
                  <md-button v-if="oldDepiction.status === 'complete'" id="deleteFile" class="md-icon-button"
                    @click.native.prevent="oldDepiction.status = 'delete'">
                    <md-tooltip> Delete file </md-tooltip>
                    <md-icon>delete</md-icon>
                  </md-button>
                  <md-button v-if="oldDepiction.status === 'delete'" id="undoDelete" class="md-icon-button"
                    @click.native.prevent="oldDepiction.status = 'complete'">
                    <md-tooltip> Undo Delete </md-tooltip>
                    <md-icon>restore_from_trash</md-icon>
                  </md-button>
                </div>
              </span>
              <span>
              <div id="depictWrapper" class="u--margin-posmd justify-center" style="visibility: hidden; height:200px">
                <h4 v-if="oldDepiction">
                  Replacement thumbnail<span v-if="depiction">: {{(optionalChaining(() => depiction.name))}}</span>
                </h4>
              <figure>
                <img id="depictImg" src="" alt="Image preview..." style="height:150px">
                <figcaption v-if="oldDepiction">This original thumbnail will be deleted and replaced by this image</figcaption>
              </figure>
              <md-button @click="removeImage" type="button" class="close md-raised">Remove image</md-button>
              </div>
              </span>
            </div>

            </div>
            <div class="md-card-actions md-alignment-right chart_editor__right-view ">
              <md-button
                @click="goToStep('first', 'second')"
                class="md-theme-default md-button_next">
                Next
              </md-button>
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
                  <md-field :class="{ 'md-invalid': ((invalid['second'] && (optionalChaining(() => !dataset.contactPoint['@id']))) || invalid.orcid) }">
                    <label style="font-size:14px">ORCID Identifier (e.g., 0000-0001-2345-6789)</label>
                    <md-input v-model="orcidId" required @change="lookupOrcid" ></md-input>
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
                  <md-field :class="{ 'md-invalid': (invalid['second'] && !dataset.contactPoint.firstName) }">
                    <label>First name</label>
                    <md-input v-model="dataset.contactPoint.firstName" required></md-input>
                    <span class="md-error">Contact point required</span>
                  </md-field>
                </div>

                <div class="md-layout-item md-size-20 md-xsmall-size-100 md-medium-size-50 u_margin-bottom-med">
                  <md-field :class="{ 'md-invalid': (invalid['second'] && !dataset.contactPoint.lastName) }">
                    <label>Last name</label>
                    <md-input v-model="dataset.contactPoint.lastName" required></md-input>
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

              <div>
                <label>Associated Organization (e.g., name of university)</label>
                <div>
                  <md-chip md-deletable class="u_margin-bottom-small" v-for="(element, i) in dataset.organization"
                    @md-delete="deleteOrg(dataset.organization, i)" :key="`org_${i}`">{{ element.name }}
                  </md-chip>
                </div>
                <md-field md-dense class="u--margin-none">
                    <md-input
                      v-model="searchKeywordOrg"
                      name="searchKeywordOrg"
                      id="searchKeywordOrg"
                      placeholder="Search Organizations"
                    ></md-input>
                    <md-icon>search</md-icon>
                  </md-field>
                <template v-if="!!organizations.length && showDropdown">
                  <ul
                    class="search-dropdown-menu-plain"
                    :style="setDropdownPosition()"
                  >
                    <li
                      v-for="(item, index) in organizations"
                      :key="index"
                      @click.prevent="selectOrg(item)"
                    >
                      <span>
                        {{ item.name }}
                        <span v-if="(optionalChaining(() => item.addresses[0].city))
                          || (optionalChaining(() => item.country.country_code))">
                          ({{ (optionalChaining(() => item.addresses[0].city)) }},
                          {{ (optionalChaining(() => item.country.country_code)) }})
                        </span>
                      </span>
                    </li>
                  </ul>
                </template>
              </div>

            </md-content>

            <!-- <md-divider class="u_width--max" style="border-style: solid"></md-divider> -->

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
              <!-- <div class="md-headline" style="margin-top: 10px; margin-bottom: 10px">
                Publication Information
              </div> -->
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
                <div class="md-subhead" v-if="depiction">Cover Image: {{depiction.name}}</div>
                <div class="md-subhead" v-else-if="oldDepiction && (oldDepiction.status !== 'delete')">
                  Cover Image: {{oldDepiction.originalname}}
                </div>
              </md-card-header-text>

              <md-card-media md-big v-show="depiction" style="height:0px">
                <span id="depictWrapperMini" style="visibility: hidden">
                  <figure>
                    <img id="depictImgMini" src="" alt="Image preview">
                    <figcaption v-if="oldDepiction">New thumbnail</figcaption>
                  </figure>
                </span>
              </md-card-media>
              <md-card-media md-big v-if="oldDepiction" style="height:0px">
                <span>
                  <figure>
                    <img :src="oldDepiction.accessUrl" alt="Image preview">
                    <figcaption v-if="oldDepiction.status==='delete' || !!depiction">
                      Old thumbnail. Will be deleted when edits are submitted</figcaption>
                  </figure>
                </span>
              </md-card-media>
            </md-card-header>
            <md-card-content>
              <div class="u_margin-bottom-small"><h3>Title:</h3> {{ dataset.title }} </div>
              <div v-if="(optionalChaining(() => dataset.refby.length))" class="u_margin-bottom-small"><h3>DOI:</h3> {{dataset.refby}} </div>
              <div v-if="(optionalChaining(() => dataset.contactPoint['@id']))" class="u_margin-bottom-small">
                <h3>Contact Point:</h3>
                {{(optionalChaining(() => dataset.contactPoint['firstName']))}}
                {{(optionalChaining(() => dataset.contactPoint['lastName']))}},
                {{(optionalChaining(() => dataset.contactPoint['cpEmail']))}}
              </div>
              <div class="u_margin-bottom-small">
              <h3>Files: </h3>
                <div class="md-subhead" v-if="oldDistributions.length && distrFiles.length">New Uploads</div>
                <ul>
                  <li v-for="(file, index) in distrFiles" :key="index" class="u--margin-leftsm">
                    {{(optionalChaining(() => file.file.name))}}
                  </li>
                </ul>
                <div v-if="oldDistributions.length">
                  <div class="md-subhead">Original Files</div>
                  <ul>
                    <li v-for="(file, index) in oldDistributions" :key="`${index}_old`" class="u--margin-leftsm">
                    {{(optionalChaining(() => file.name))}}
                    </li>
                  </ul>
                </div>
              </div>
              <div class="u_margin-bottom-small"><h3>Description:</h3> {{dataset.description}}</div>
              <div v-if="dataset.organization.length" class="u_margin-bottom-small">
                <h3>Associated Organization(s):</h3>
                <span v-for="(org, index) in dataset.organization" :key="`org_${index}`">
                  <span v-if="index==0">{{ org.name }}</span>
                  <span v-else>, {{ org.name }}</span>
                </span>
              </div>
              <div v-if="dataset.datePub['@value']" class="u_margin-bottom-small">
                <h3>Date published:</h3> {{dataset.datePub['@value']}}
              </div>
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
    <div v-else-if="dialog.type=='success'">
      <div v-if="!!datasetId"> Dataset with ID {{ datasetId }} successfully updated </div>
      <div v-else> New dataset created with ID {{generatedUUID}} </div>
    </div>
    <div v-else-if="dialog.type=='deleteOld'">
      <div> Selecting "Yes, Delete" will permanently remove the file from the MaterialsMine database for all users. </div>
      <div> This action cannot be undone. </div>
      <div> Selected file: <a :href="(optionalChaining(() => toDelete.uri))" download>
        {{ (optionalChaining(() => toDelete.name)) }} </a>
      </div>
    </div>
    <div v-else-if="dialog.type=='doiData'">
      The following data was imported from DOI.org. Use to auto-fill form?
      This will replace any fields that you may have already filled.
      <div v-if="doiData.title"> <b>Title: </b>
        {{ (optionalChaining(() => doiData.title[0])) }}
      </div>
      <div v-if="doiData.published"> <b>Date Published: </b>
        {{ (optionalChaining(() => doiData.published['date-parts'].flat() )) }}
      </div>

    </div>
  </template>
  <template v-slot:actions>
    <div v-if="dialog.type=='success'">
      <md-button @click="goToDataset">OK</md-button>
    </div>
    <div v-if="dialog.type=='deleteOld'">
      <md-button @click="toggleDialogBox()">No, Cancel</md-button>
      <md-button @click="deleteDistribution(toDelete)">Yes, Delete</md-button>
    </div>
    <div v-if="dialog.type=='doiData'">
      <md-button @click="toggleDialogBox()">No, don't use</md-button>
      <md-button @click="useDoiData()">Yes, use imported data</md-button>
    </div>
  </template>
</dialogbox>
</div>
</template>

<script>
import _ from 'lodash'
import FileDrop from '@/components/curate/FileDrop.vue'
import FilePreview from '@/components/curate/FilePreview.vue'
import Dialog from '@/components/Dialog.vue'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
import Spinner from '@/components/Spinner.vue'
import useFileList from '@/modules/file-list'
import optionalChainingUtil from '@/mixins/optional-chaining-util'
import { saveDataset, isValidOrcid, loadDataset, parseFileName, deleteFile } from '@/modules/whyis-dataset'
import { mapGetters, mapMutations } from 'vuex'
const { v4: uuidv4 } = require('uuid')
const datasetUuid = uuidv4()
const distrFn = useFileList()

export default {
  name: 'SDDHome',
  props: ['datasetId'],
  mixins: [optionalChainingUtil],
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
      generatedUUID: datasetUuid,
      doi: '',
      orcidId: null,
      searchKeywordOrg: '',
      showDropdown: false,
      distrFiles: distrFn.files,
      depiction: null,
      dataset: {
        '@type': 'http://www.w3.org/ns/dcat#Dataset',
        // Dataset info: Step 1
        refby: '',
        // Dataset info: Step 2
        title: '',
        contactPoint: {
          '@type': 'schemaPerson',
          '@id': null,
          firstName: '',
          lastName: '',
          cpEmail: ''
        },
        description: '',
        contributors: [],
        datePub: {
          '@type': 'date',
          '@value': ''
        },
        organization: []
      },
      // For editing existing datasets
      oldDistributions: [],
      toDelete: null,
      oldDepiction: null,
      dialog: {
        title: '',
        type: null,
        size: 60,
        disableClose: false
      }
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox',
      doiData: 'explorer/curation/getDoiData',
      orcidData: 'explorer/curation/getOrcidData',
      organizations: 'explorer/curation/getRorData'
    }),
    secondPageFilled () {
      return !!this.dataset.title && !!this.dataset?.contactPoint?.['@id'] &&
      !!this.dataset.contactPoint.firstName && !!this.dataset.contactPoint.lastName &&
      !!this.dataset.contactPoint.cpEmail && !!this.dataset.description &&
      !this.invalid.orcid
    },
    userInfo () {
      return {
        '@id': `https://materialsmine.org/api/user/${this.$store.getters['auth/userId']}`,
        firstName: this.$store.getters['auth/user'].givenName,
        lastName: this.$store.getters['auth/user'].surName
      }
    }
  },
  watch: {
    orcidData (newValue, oldValue) {
      if (newValue === 'invalid') {
        this.invalid.orcid = true
      } else {
        this.invalid.orcid = false
        this.dataset.contactPoint['@id'] = this.orcidData?.['@id']
        this.dataset.contactPoint.firstName = this.orcidData?.['http://schema.org/givenName'][0]?.['@value']
        this.dataset.contactPoint.lastName = this.orcidData?.['http://schema.org/familyName'][0]?.['@value']
        this.dataset.contactPoint.cpEmail = this.orcidData?.['http://www.w3.org/2006/vcard/ns#email']?.[0]?.['@value']
      }
    },
    searchKeywordOrg (newVal) {
      if (newVal) {
        this.lookupOrganization({ query: newVal })
      }
      this.showDropdown = true
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
    clearFileList: distrFn.clearAllFiles,
    navBack () {
      this.$router.back()
    },
    async loadDataset () {
      try {
        const response = await loadDataset(`${window.location.origin}/explorer/dataset/${this.datasetId}`)
        if (response[0]?.refby.length) {
          this.doi = response[0]?.refby[0].split('.org/')[1]
        }
        this.dataset = response[0]
        this.oldDistributions = response?.[1]
        if (response?.[2]) {
          const thumbnailResponse = await this.$store.dispatch('explorer/fetchDatasetThumbnail', response?.[2]?.[0]?.['@id'])
          const accessUrl = thumbnailResponse[0]?.['@value'] ?? ''
          this.oldDepiction = {
            accessUrl,
            originalname: parseFileName(accessUrl),
            status: 'complete'
          }
        }
        this.orcidId = response?.[0]?.contactPoint?.['@id']?.split('http://orcid.org/')[1]
        this.lookupOrcid(this.orcidId)
        if (this.dataset?.organization?.length) {
          const orgs = this.dataset.organization.map(async (org) => {
            const rorId = org['@id'].split('https://ror.org/')[1]
            const rorOrg = await this.$store.dispatch('explorer/curation/searchRor', { id: rorId })
            return {
              '@id': org['@id'],
              '@type': 'organization',
              name: rorOrg[0].name
            }
          })
          this.dataset.organization = await Promise.all(orgs)
        }
      } catch (e) {
        this.$store.commit('setSnackbar', { message: e })
        this.loading = false
      }
    },
    onInputChange (e) {
      this.addDistr(e.target.files)
      e.target.value = null
      this.invalid.first = null
    },
    goToStep (id, index) {
      this.clearSnackbar()
      if (id === 'first' && !this.distrFiles.length && !this.oldDistributions?.length) {
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
      const id = e?.target?.value ?? e
      if (isValidOrcid(id)) {
        this.invalid.orcid = false
        await this.$store.dispatch('explorer/curation/lookupOrcid', id)
      } else {
        this.invalid.orcid = true
      }
    },
    async lookupDoi (e) {
      await this.$store.dispatch('explorer/curation/lookupDoi', e.target.value)
      if (this.doiData) {
        this.dataset.refby = this.doiData?.URL
        this.renderDialog('Use imported DOI data?', 'doiData', 40)
      }
    },
    lookupOrganization: _.debounce(function (payload) {
      this.$store.dispatch('explorer/curation/searchRor', payload)
    }, 300),
    selectOrg (item) {
      const formatOrg = {
        '@id': item.id,
        '@type': 'organization',
        name: item.name
      }
      if (!this.dataset.organization.includes(formatOrg)) {
        this.dataset.organization.push(formatOrg)
        this.searchKeywordOrg = ''
        return
      }
      this.$store.commit('setSnackbar', {
        message: 'Duplicate Value Entered',
        duration: 3000
      })
    },
    deleteOrg (arr, e) {
      arr.splice(e, 1)
    },
    setDropdownPosition () {
      return { position: 'relative', top: '-2rem', zIndex: 10, minHeight: 'auto' }
    },
    async disableDropdownRender (e) {
      const selected = e.target.closest('.search_box')
      if (!selected) {
        this.showDropdown = false
      }
    },
    useDoiData () {
      this.dataset.title = this.doiData?.title[0] ?? this.dataset.title
      if (this.doiData?.published?.['date-parts'].flat().length === 3) {
        const dateArray = this.doiData.published['date-parts'].flat()
        this.dataset.datePub['@value'] = dateArray[0].toString() + '-' +
          (dateArray[1] < 10 ? '0' + dateArray[1].toString() : dateArray[1].toString()) + '-' +
          (dateArray[2] < 10 ? '0' + dateArray[2].toString() : dateArray[2].toString())
      }
      this.toggleDialogBox()
    },
    // Load a thumbnail of the representative image
    previewFile () {
      const preview = document.querySelector('#depictImg')
      const wrapper = document.querySelector('#depictWrapper')
      const previewMini = document.querySelector('#depictImgMini')
      const wrapperMini = document.querySelector('#depictWrapperMini')
      const file = document.querySelector('#file-depict-input').files[0]
      const reader = new FileReader()
      this.depiction = file

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
      this.depiction = null
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
    async deleteDistribution (file) {
      try {
        await deleteFile(this.file?.fileId)
        const index = this.oldDistributions.indexOf(file)
        if (index > -1) this.oldDistributions.splice(index, 1)
      } catch (e) {
        this.$store.commit('setSnackbar', { message: e })
      }
      this.toggleDialogBox()
    },
    confirmDeletion (file) {
      this.toDelete = file
      this.toDelete.fileId = parseFileName(file?.uri, true)
      this.renderDialog('Delete file?', 'deleteOld', 40, false)
    },
    // Format files for submission
    processFiles () {
      return this.distrFiles.map((file) => ({ ...file, status: 'incomplete' }))
        .concat(this.oldDistributions.map((file) => ({ ...file, status: 'complete' })))
    },
    // Ensure only one thumbnail is associated with the dataset
    processDepictions () {
      const depictions = []
      if (this.depiction) {
        depictions.push({ file: this.depiction, status: 'incomplete' })
        if (this.oldDepiction) { this.oldDepiction.status = 'delete' }
      } if (this.oldDepiction) depictions.push({ ...this.oldDepiction })
      return depictions
    },
    // Submit and post as nanopublication
    async submitForm () {
      this.uploadInProgress = 'Uploading files'
      this.renderDialog('Submitting dataset', 'loading', 40, true)
      this.clearSnackbar()
      if ((!this.distrFiles.length && !this.oldDistributions?.length) || !this.secondPageFilled) {
        this.setSnackbar({
          message: 'Unable to submit, check for required fields'
        })
        this.toggleDialogBox()
        this.invalid.first = (!this.distrFiles.length && !this.oldDistributions?.length) ? 'Missing required field' : null
        this.invalid.second = !this.secondPageFilled ? 'Missing required field' : null
      } else {
        this.dataset.creator = this.userInfo
        const processedFiles = this.processFiles()
        const processedImg = this.processDepictions()
        try {
          const datasetNanopub = await saveDataset(this.dataset, processedFiles, processedImg, this.generatedUUID)
          await this.$store.dispatch('explorer/curation/cacheNewEntityResponse', {
            identifier: this.dataset.uri,
            resourceNanopub: datasetNanopub,
            type: 'datasets'
          })
          this.dialog.title = 'Upload successful'
          this.dialog.type = 'success'
        } catch (err) {
          this.toggleDialogBox()
          this.setSnackbar({ message: err.response ?? err })
        }
      }
    },
    goToDataset () {
      this.toggleDialogBox()
      const datasetId = this.datasetId ?? this.generatedUUID
      this.clearFileList() // Reset imported module
      return this.$router.push(`/explorer/dataset/${datasetId}`)
    }
  },
  async created () {
    this.loading = true
    if (this.datasetId) await this.loadDataset()
    this.loading = false
  }
}
</script>
