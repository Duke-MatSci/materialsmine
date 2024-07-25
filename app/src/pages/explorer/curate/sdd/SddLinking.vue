<template>
  <div>
    <div>
      <CurateNavBar active="Link Dataset to SDD" :navRoutes="navRoutes" />
    </div>
    <div>
      <div class="section_loader" v-if="loading">
        <spinner :loading="loading" text='Loading Dataset' />
      </div>
      <div v-else class="curate">
        <md-card style="margin: 10px">
          <form class="modal-content" action="" method="post" enctype="multipart/form-data"
            upload_type="http://www.w3.org/ns/dcat#Dataset">
            <md-steppers class="form__stepper" :md-active-step.sync="active" md-linear>
              <md-step id="first" md-label="Dataset Info">
                Linking has not been completed for this dataset.
                Are you ready to finish linking the data?
                <a>Click here</a> if you'd like to request assistance from an admin.

                <md-card-header>
                  <md-card-header-text>
                    <div class="md-subhead">Dataset Summary:</div>
                    <div class="md-title">
                      {{ (optionalChaining(() => dataset[datasetFields['title']][0]['@value'])) || "Curated Dataset" }}
                    </div>
                    <!-- <div class="md-subhead" v-if="dataset[datasetFields['depiction']]">Cover Image: {{ depiction.name }}</div> -->
                  </md-card-header-text>

                  <md-card-media
                    md-big
                    v-show="(optionalChaining(() => dataset[datasetFields['depiction']]))"
                    style="height:0px"
                  >
                    <span id="depictWrapperMini">
                      <figure>
                        <img id="depictImgMini" v-if="thumbnail" :src="(optionalChaining(() => thumbnail[0]['@value']))"
                          alt="Image preview">
                      </figure>
                    </span>
                  </md-card-media>
                </md-card-header>
                <md-card-content>
                  <div v-if="(optionalChaining(() => dataset[datasetFields['doi']]))">
                    DOI: <a class=" u--b-rad">{{ doi }}</a>
                  </div>
                  <div class="u_margin-bottom-small">
                    {{ (optionalChaining(() => dataset[datasetFields['description']][0]['@value'])) }}
                  </div>
                  <div v-if="orcidData" class="u_margin-bottom-small">
                    <span>
                      <h3>Contact Point:</h3>
                      {{ (optionalChaining(() => orcidData['http://schema.org/givenName'][0]['@value'])) || '' }} {{
        (optionalChaining(() => orcidData['http://schema.org/familyName'][0]['@value'])) || '' }}
                    </span>
                    <div><a class=" u--b-rad" :href="(optionalChaining(() => orcidData['@id']))" target="_blank">
                        {{ (optionalChaining(() => orcidData['@id'])) || (optionalChaining(() =>
        dataset[datasetFields.cp][0]['@id'])) || 'N/A' }}
                      </a></div>
                    <div v-if="orcidData['http://www.w3.org/2006/vcard/ns#email']">
                      {{ (optionalChaining(() => orcidData['http://www.w3.org/2006/vcard/ns#email'][0]['@value'])) ||
        'N/A' }}</div>
                  </div>
                  <div class="u_margin-bottom-small">
                    <h3>Files: </h3>
                    <ul>
                      <li v-for="(file, index) in distributions" :key="`file_${index}`" class="u--margin-leftsm">
                        <a :href="(optionalChaining(() => file.downloadLink))" download>
                          {{ (optionalChaining(() => file.label)) }}
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div v-if="(optionalChaining(() => dataset[datasetFields['datePub']]))">
                    <span class="u--color-black">
                      Date Published:
                    </span>
                    <span>
                      {{ (optionalChaining(() => dataset[datasetFields['datePub']][0]['@value'])) || 'N/A' }}
                    </span>
                  </div>
                </md-card-content>
                <div class="md-card-actions md-alignment-right chart_editor__right-view">
                  <md-button @click="goToStep('first', 'second')" class="md-theme-default md-button_next">
                    Next
                  </md-button>
                </div>
              </md-step>
              <md-step id="second" md-label="URI namespace">
                <div class="md-layout">
                  <div style="margin: 20px">
                    Do you want to use the default namespace?
                    If you're not sure, skip this step.
                    <div>
                      <md-radio v-model="defaultNamespace" :value="true" style="margin-left:4rem"
                        class="md-primary">Yes,
                        use
                        default</md-radio>
                      <md-radio v-model="defaultNamespace" :value="false" style="margin-left:4rem"
                        class="md-primary">No,
                        use custom</md-radio>
                    </div>
                    <div class="md-layout-item md-size-50" v-if="!defaultNamespace">
                      <md-field>
                        <label>Custom Namespace</label>
                        <md-input v-model="namespace"></md-input>
                      </md-field>
                    </div>
                  </div>
                  <md-card-actions class="u_width--max u_height--max" style="margin: 20px; padding-top:5rem;">
                    <div class="md-layout md-gutter ">
                      <div class="md-layout-item md-size-10 md-xsmall-size-35">
                        <md-button @click="goToStep('second', 'first')" class="md-theme-default md-button_prev">
                          Previous
                        </md-button>
                      </div>
                      <div class="md-layout-item md-size-80 md-small-size-70 md-xsmall-size-30">
                      </div>
                      <div class="md-layout-item md-size-10 md-small-size-20 md-xsmall-size-35">
                        <md-button @click="goToStep('second', 'third')" class="md-theme-default md-button_next">
                          Next
                        </md-button>
                      </div>
                    </div>
                  </md-card-actions>
                </div>
              </md-step>
              <md-step id="third" md-label="CSV Files" :md-error="invalid.third">
                <div class="md-layout">
                  <md-content>
                    <div>What delimiter is used in the .csv file(s)?</div>
                    <div>
                      <div v-for="(item, index) in distributions" :key="`csv_${index}`"
                        class="md-layout md-gutter u_height--max">
                        <div class="md-layout-item" style="margin: 2rem; padding: 1rem;"
                          v-if="item.fileExtension === 'csv'">
                          {{ item.label }}:
                        </div>
                        <div class="md-layout-item" v-if="item.fileExtension === 'csv'">
                          <md-field style="max-width: 40%;">
                            <label>delimiter</label>
                            <md-input v-model="distributions[index]['delimiter']"></md-input>
                          </md-field>
                        </div>
                      </div>
                    </div>
                  </md-content>

                  <md-card-actions class="u_width--max u_height--max" style="margin: 20px; padding-top:5rem;">
                    <div class="md-layout md-gutter ">
                      <div class="md-layout-item md-size-10 md-xsmall-size-35">
                        <md-button @click="goToStep('third', 'second')" class="md-theme-default md-button_prev">
                          Previous
                        </md-button>
                      </div>
                      <div class="md-layout-item md-size-80 md-small-size-70 md-xsmall-size-30">
                      </div>
                      <div class="md-layout-item md-size-10 md-small-size-20 md-xsmall-size-35">
                        <md-button @click="goToStep('third', 'fourth')" class="md-theme-default md-button_next">
                          Next
                        </md-button>
                      </div>
                    </div>
                  </md-card-actions>
                </div>
              </md-step>
              <md-step id="fourth" md-label="SDD File" :md-error="invalid.fourth">
                <h3>Is one of the files a Semantic Data Dictionary (SDD)?</h3>
                <div style="margin: 2rem;">
                  If yes, select the SDD(s) from the list of files:
                  <div v-for="(item, index) in distributions" :key="`distrs_${index}`">
                    <md-checkbox v-model="isSddArray" :value="index" class="md-primary">
                      {{ item.label }}
                    </md-checkbox>
                  </div>
                </div>

                <h3>Which SDD does your dataset follow?</h3>
                <div style="margin: 2rem;">
                  <div>
                    <md-checkbox v-model="whichSdd" value="uploaded" class="md-primary" v-if="isSddArray.length">
                      The uploaded SDD:
                      <span class="">
                        <select class="" v-model="selectSdd" name="selectSdd" id="selectSdd">
                          <option v-for="index in isSddArray" :key="`sdds_${index}`">{{ distributions[index]['label'] +
        ' ' }} </option>
                        </select>
                      </span>
                    </md-checkbox>
                  </div>
                  <div><md-checkbox v-model="whichSdd" value="other" class="md-primary">A different SDD previously
                      uploaded that isn't one of these files</md-checkbox></div>
                  <div><md-checkbox v-model="whichSdd" value="none" class="md-primary">The SDD used by my data hasn't
                      been
                      uploaded yet</md-checkbox></div>
                </div>

                <div class="md-layout-item md-size-50" v-if="whichSdd == 'other'">
                  <md-field>
                    <label>Search for SDD</label>
                    <md-input v-model="searchSdd"></md-input>
                  </md-field>
                </div>
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
</template>
<script>
import spinner from '@/components/Spinner'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
import { mapGetters, mapMutations } from 'vuex'
import reducer from '@/mixins/reduce'
import optionalChainingUtil from '@/mixins/optional-chaining-util'
import { parseFileName } from '@/modules/whyis-dataset'
import { postNewNanopub } from '@/modules/whyis-utils'

export default {
  name: 'SDDLinking',
  props: ['datasetId'],
  mixins: [reducer, optionalChainingUtil],
  data () {
    return {
      loading: true,
      navRoutes: [
        {
          label: 'Curate',
          path: '/explorer/curate'
        },
        {
          label: 'Edit Dataset',
          path: `/explorer/curate/sdd/edit/${this.datasetId}`
        }
      ],
      datasetFields: {
        description: 'http://purl.org/dc/terms/description',
        doi: 'http://purl.org/dc/terms/isReferencedBy',
        datePub: 'http://purl.org/dc/terms/issued',
        title: 'http://purl.org/dc/terms/title',
        cp: 'http://www.w3.org/ns/dcat#contactpoint',
        distribution: 'http://www.w3.org/ns/dcat#distribution',
        depiction: 'http://xmlns.com/foaf/0.1/depiction'
      },
      distributions: [],
      isSddArray: [],
      whichSdd: null,
      selectSdd: '',
      active: 'first',
      invalid: {
        third: null,
        fourth: null
      },
      defaultNamespace: true,
      namespace: '',
      testboolean: false
    }
  },
  components: {
    spinner,
    CurateNavBar
  },
  watch: {
    dataset (newValues, oldValues) {
      this.loading = false
      if (newValues?.[this.datasetFields.cp]) {
        const orcid = this.dataset[this.datasetFields.cp][0]['@id']
        const trimmedId = orcid.replace('http://orcid.org/', '')
          .replace(`${window.location.origin}/`, '')
        this.lookupOrcid(trimmedId)
      }
      if (newValues?.[this.datasetFields.depiction]) {
        const thumbnailUri = this.dataset[this.datasetFields.depiction][0]['@id']
        this.$store.dispatch('explorer/fetchDatasetThumbnail', thumbnailUri)
      }
      if (newValues?.[this.datasetFields.distribution]) {
        for (const index in newValues[this.datasetFields.distribution]) {
          const downloadLink = newValues[this.datasetFields.distribution][index]?.['@id']
          const label = parseFileName(downloadLink)
          const fileExtension = label.split('.').pop()?.toLowerCase()
          this.distributions[index] = {
            downloadLink,
            label,
            fileExtension,
            delimiter: null
          }
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox',
      isAuth: 'auth/isAuthenticated',
      isAdmin: 'auth/isAdmin',
      dataset: 'explorer/getCurrentDataset',
      thumbnail: 'explorer/getDatasetThumbnail',
      orcidData: 'explorer/curation/getOrcidData'
    }),
    doi () {
      if (this.dataset?.[this.datasetFields.doi]) {
        const doiString = this.dataset[this.datasetFields.doi][0]['@value']
        return doiString.replace('http://dx.doi.org/', '')
      } return ''
    },
    fullDatasetUri () {
      return `${window.location.origin}/explorer/dataset/${this.datasetId}`
    },
    title () {
      return this.dataset[this.datasetFields.title][0]['@value']
    }
  },
  methods: {
    ...mapMutations({
      setSnackbar: 'setSnackbar',
      clearSnackbar: 'resetSnackbar'
    }),
    async loadDataset () {
      try {
        await this.$store.dispatch('explorer/fetchSingleDataset', this.fullDatasetUri || undefined)
      } catch (e) {
        this.setSnackbar({ message: e })
      } finally {
        this.loading = false
      }
    },
    lookupOrcid (id) {
      this.$store.dispatch('explorer/curation/lookupOrcid', id)
    },
    goToStep (id, index) {
      this.clearSnackbar()
      if (id === 'third' && this.checkInvalidThird()) return
      this[id] = true
      this.active = index
    },
    checkInvalidThird () {
      let isInvalid = false
      const csvs = this.distributions.filter(x => x.fileExtension === 'csv')
      for (const index in csvs) {
        isInvalid = isInvalid || !csvs[index].delimiter
      }
      if (isInvalid) this.invalid.third = 'Check delimiters'
      else this.invalid.third = null
      return isInvalid
    },
    processSddList () {
      for (const index in this.isSddArray) {
        const distrInd = this.isSddArray[index]
        this.distributions[distrInd].isSdd = true
      }
    },
    createDatasetLd () {
      const jsonLd = {
        '@id': this.fullDatasetUri
      }
      let namespace = `${this.fullDatasetUri}/`
      if (!this.defaultNamespace && this.namespace) {
        namespace = this.namespace
      }
      jsonLd['http://rdfs.org/ns/void#uriSpace'] = {
        '@value': namespace,
        '@lang': null,
        '@type': 'http://www.w3.org/2001/XMLSchema#string'
      }
      return jsonLd
    },
    createFileLd (index) {
      const distribution = this.distributions[index]
      const jsonLd = {
        '@id': distribution.downloadLink
      }
      if (distribution.fileExtension === 'csv') {
        jsonLd['http://www.w3.org/ns/csvw#delimiter'] = {
          '@value': distribution.delimiter,
          '@type': 'http://www.w3.org/2001/XMLSchema#string'
        }
        jsonLd['http://open.vocab.org/terms/hasContentType'] = 'text/csv'
        if (this.whichSdd === 'other' && this.searchSdd) {
          jsonLd['http://purl.org/dc/terms/conformsTo'] = {
            '@id': this.searchSdd
          }
        } else if (this.whichSdd === 'uploaded' && this.selectSdd) {
          jsonLd['http://purl.org/dc/terms/conformsTo'] = {
            '@id': this.selectSdd
          }
        }
      } else if (distribution?.isSdd) {
        jsonLd['@type'] = 'http://purl.org/twc/sdd/SemanticDataDictionary'
      }
      return jsonLd
    },
    async submitForm () {
      this.clearSnackbar()
      if (this.checkInvalidThird()) {
        return this.setSnackbar({ message: 'Check for errors in required fields' })
      }
      this.processSddList()
      const datasetJsonLd = this.createDatasetLd()
      const promises = []
      promises.push(postNewNanopub(datasetJsonLd))
      for (const file in this.distributions) {
        promises.push(postNewNanopub(this.createFileLd(file)))
      }
      Promise.all(promises)
        .then((response) => {
          console.log(response)
        })
        .catch((e) => {
          throw (e)
        })
    }
  },
  created () {
    this.loading = true
    this.loadDataset()
  }
}
</script>
