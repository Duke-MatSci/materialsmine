<template>
    <div class="image-detail-page">
      <div class="section_loader" v-if="loading">
        <spinner :loading="loading" text='Loading Dataset'/>
      </div>
      <div class="utility-roverflow" v-else-if="dataset">
        <div class="utility-content__result teams_partner">
          <div class="utility-space search_box_form u--layout-flex-justify-end">
            <md-button id="navbackBtn" class="md-icon-button" @click.native.prevent="navBack">
              <md-tooltip> Go Back </md-tooltip>
              <md-icon>arrow_back</md-icon>
            </md-button>
            <md-button id="shareChartBtn"  class="md-icon-button" @click.native.prevent="handleShare">
              <md-tooltip> {{ shareToolTip }} </md-tooltip>
              <md-icon>share</md-icon>
            </md-button>
          </div>
        </div>

        <md-card md-theme="green-card" class="md-primary u--shadow-none u--padding-zero-mobile">
          <md-card-header class="section_md-header ">
            <md-card-header-text class="section_text-col flex-item">
              <div v-if="dataset[datasetFields['title']]" class="md-title u--margin-header">
                {{ dataset[datasetFields['title']]?.[0]?.['@value'] || "Curated Dataset"}}
              </div>
              <div v-if="dataset[datasetFields['doi']]">
                DOI: <a class=" u--b-rad" @click="nav_to_doi(doi)">{{ doi }}</a>
              </div>
              <div v-if="dataset[datasetFields['description']]">
                {{ dataset[datasetFields['description']][0]['@value'] }}
              </div>
            </md-card-header-text>
            <div v-if="dataset[datasetFields['depiction']]" class="quicklinks_content flex-item u--padding-zero" style="max-width:20rem;">
              <img v-if="thumbnail" :src="thumbnail?.[0]?.['@value']"
                :alt="`${dataset[datasetFields['title']]?.[0]?.['@value']} image` || 'Dataset Thumbnail'"
                class="facet_viewport img">
            </div>
          </md-card-header>
        </md-card>

        <div class="search_box_form image-detail-page-tab u--layout-flex-justify-fs u--margin-centered  u--font-emph-smm u--margin-bottommd u--color-grey-sec u--dimension-size-m u--margin-leftsm ">
          <div @click="nav_to_tab" name="ds_active" :class="{'u--margin-rightmd': true, 'section_tabb-controller': !tabbed_content.ds_active, u_pointer: true, 'u--padding-rl-xs': true}">Distributions</div>
          <div @click="nav_to_tab" name="md_active" :class="{'u--margin-rightmd': true, 'section_tabb-controller': !tabbed_content.md_active, u_pointer: true, 'u--padding-rl-xs': true}">Metadata</div>
          <div @click="nav_to_tab" name="au_active" :class="{'u--margin-rightmd': true, 'section_tabb-controller': !tabbed_content.au_active, u_pointer: true, 'u--padding-rl-xs': true}">Authors</div>
        </div>

        <div>
          <div id="related-images" :class="{search_box_form: true, 'u--layout-flex-justify-se': true, explorer_page_header: true, 'u--layout-flex-switch': tabbed_content.ds_active}">
            <div class="search_box_form howto_item-header">
              <md-button :class="{'md-icon-button': true, 'u--layout-hide': hideAssetNavLeft}" @click.prevent="reduceAsset('prev')">
                <md-tooltip> Show Left </md-tooltip>
                <md-icon>arrow_back</md-icon>
              </md-button>

              <div class="section_md-header u_display-flex image-detail-page__relatedImg">
                <md-card
                  v-for="(item, index) in distributions"
                  class="md-card-class u--margin-none"
                  :class="`charts-${index+1} charts-${index+1}-narrow`"
                  :key="`card_${index}`"
                >
                <a :href="(optionalChaining(() => item?.downloadLink))">
                  <md-card-media-cover md-solid>
                    <md-card-media md-ratio="4:3">
                      <md-icon class="explorer_page-nav-card_icon u_margin-top-small">description</md-icon>
                    </md-card-media>

                    <md-card-area class="u_gridbg">
                      <md-card-header class="u_show_hide">
                        <span class="md-subheading">
                          <strong>{{ item?.label || 'Dataset File'}}</strong>
                        </span>
                        <span class="md-body-1">Click to download</span>
                      </md-card-header>
                    </md-card-area>
                  </md-card-media-cover>
                </a>
                </md-card>
              </div>

              <md-button id="shareChartBtn"  :class="{'md-icon-button': true }" @click.prevent="reduceAsset('next')" >
                <md-tooltip> Show Right </md-tooltip>
                <md-icon>arrow_forward</md-icon>
              </md-button>
            </div>
          </div>

          <div v-if="dataset" id="metadata" :class="{search_box_form: true, 'u--layout-flex-justify-se': true, explorer_page_header: true, 'u--layout-flex-switch': tabbed_content.md_active, metadata:true}">
            <div class="u--margin-pos" v-if="dataset[datasetFields['datePub']]">
              <span class="u--font-emph-xl u--color-black">
                Date Published:
              </span>
              <span class="u--font-emph-xl u--color-grey-sec">
                {{ dataset[datasetFields['datePub']]?.[0]?.['@value'] || 'N/A' }}
              </span>
            </div>
            <div v-else>
              <span class="u--font-emph-xl u--color-grey-sec">
                N/A
              </span>
            </div>
          </div>

          <div v-if="dataset"  id="authors" :class="{search_box_form: true, 'u--layout-flex-justify-se': false, explorer_page_header: true, 'u--layout-flex-switch': tabbed_content.au_active}">
            <div class="u--margin-pos" v-if="orcidData">
              <span class="u--font-emph-xl u--color-black">
                Contact Point:
              </span>
              <span id="microscropy" class="u--font-emph-xl u--color-grey-sec">
                {{ orcidData['http://schema.org/givenName']?.[0]?.['@value'] || '' }} {{ orcidData['http://schema.org/familyName']?.[0]?.['@value'] || ''}}
              </span>
              <div>ORCiD: <a class=" u--b-rad" :href="(optionalChaining(() => orcidData?.['@id']))" target="_blank">
                {{orcidData?.['@id'] || dataset[datasetFields.cp]?.[0]?.['@id'] || 'N/A'}}
              </a></div>
              <div v-if="orcidData['http://www.w3.org/2006/vcard/ns#email']">Contact Email: {{orcidData['http://www.w3.org/2006/vcard/ns#email']?.[0]?.['@value']|| 'N/A'}}</div>
            </div>
            <div class="u--margin-pos" v-else>
              <span class="u--font-emph-xl u--color-grey-sec">
                N/A
              </span>
            </div>
          </div>
        </div>

      </div>
      <div v-else class="utility-roverflow u_centralize_text u_margin-top-med">
        <h1 class="visualize_header-h1 u_margin-top-med">Cannot Load Dataset</h1>
      </div>
    </div>
</template>
<script>
import spinner from '@/components/Spinner'
import { mapGetters } from 'vuex'
import reducer from '@/mixins/reduce'
import optionalChainingUtil from '@/mixins/optional-chaining-util'
export default {
  name: 'DatasetDetailView',
  mixins: [reducer, optionalChainingUtil],
  props: ['id'],
  data () {
    return {
      shareToolTip: 'Share Dataset',
      tabbed_content: {
        ds_active: false,
        md_active: true,
        au_active: true
      },
      assetItems: [],
      pushedAssetItem: [],
      screen: 0,
      datasetFields: {
        description: 'http://purl.org/dc/terms/description',
        doi: 'http://purl.org/dc/terms/isReferencedBy',
        datePub: 'http://purl.org/dc/terms/issued',
        title: 'http://purl.org/dc/terms/title',
        cp: 'http://w3.org/ns/dcat#contactpoint',
        distribution: 'http://w3.org/ns/dcat#distribution',
        depiction: 'http://xmlns.com/foaf/0.1/depiction'
      },
      distributions: {},
      loading: true
    }
  },
  components: {
    spinner
  },
  watch: {
    dataset (newValues, oldValues) {
      this.loading = false
      if (newValues[this.datasetFields.cp]) {
        const orcid = this.dataset[this.datasetFields.cp][0]['@id']
        const trimmedId = orcid.replace('http://orcid.org/', '')
          .replace(`${window.location.origin}/`, '')
        this.lookupOrcid(trimmedId)
      }
      if (newValues[this.datasetFields.depiction]) {
        const thumbnailUri = this.dataset[this.datasetFields.depiction][0]['@id']
        this.$store.dispatch('explorer/fetchDatasetThumbnail', thumbnailUri)
      }
      if (newValues[this.datasetFields.distribution]) {
        for (const index in newValues[this.datasetFields.distribution]) {
          const downloadLink = newValues[this.datasetFields.distribution][index]?.['@id']
          this.distributions[index] = {
            downloadLink,
            label: this.parseFileName(downloadLink)
          }
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      dataset: 'explorer/getCurrentDataset',
      thumbnail: 'explorer/getDatasetThumbnail',
      orcidData: 'explorer/curation/getOrcidData'
    }),
    doi () {
      if (this.dataset[this.datasetFields.doi]) {
        const doiString = this.dataset[this.datasetFields.doi][0]['@value']
        return doiString.replace('http://dx.doi.org/', '')
      } return ''
    },
    fullDatasetUri () {
      return `${window.location.origin}/explorer/dataset/${this.id}`
    }
  },
  methods: {
    async loadDataset () {
      try {
        await this.$store.dispatch('explorer/fetchSingleDataset', this.fullDatasetUri)
      } catch (e) {
        this.$store.commit('setSnackbar', { message: e })
        this.loading = false
      }
    },
    lookupOrcid (id) {
      this.$store.dispatch('explorer/curation/lookupOrcid', id)
    },
    navBack () {
      this.$router.back()
    },
    nav_to_tab (e) {
      Object.keys(this.tabbed_content).forEach(el => { this.tabbed_content[el] = true })
      this.tabbed_content[e.target.getAttribute('name')] = false
    },
    nav_to_doi (doi) {
      this.$router.push(`/explorer/article/${doi}`)
    },
    handleShare () {
      navigator.clipboard.writeText(this.fullDatasetUri)
      this.shareToolTip = 'Link copied to clipboard'
      setTimeout(function () { this.shareToolTip = 'Share Dataset' }, 2000)
    },
    parseFileName (file) {
      const dateString = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)-/
      return file.split(dateString).pop().replace('?isFileStore=true', '')
    }
  },
  created () {
    this.loading = true
    return this.loadDataset()
  }
}
</script>
