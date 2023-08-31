<template>
  <search-gallery :isEmpty="isEmpty" :totalItems="xmlFinder.totalItems || 0" :loading="$apollo.loading" :error="!!error">
    <template #search_input>
      <input type="text" ref="search_input" class="form__input form__input--flat"
        placeholder="Search XML" name="search" id="search"
        required v-model="searchWord" />
    </template>

    <template  #filter_inputs>
      <md-field v-if="selectedFilters.includes('apprStatus')">
        <label for="approvalStatus">Admin Approval Status</label>
        <md-select v-model="apprStatus" name="approvalStatus" id="approvalStatus">
          <md-option value="Approved">Approved</md-option>
          <md-option value="Not_Approved">Not Approved</md-option>
        </md-select>
      </md-field>
      <md-field v-if="selectedFilters.includes('curationState')">
        <label for="curationState">Curation State</label>
        <md-select v-model="curationState" name="approvalStatus" id="approvalStatus">
          <md-option value="Edit">Edit</md-option>
          <md-option value="Review">Review</md-option>
          <md-option value="Curated">Curated</md-option>
        </md-select>
      </md-field>
      <md-field v-if="selectedFilters.includes('isNew')">
        <label for="curationState">Is New Curation</label>
        <md-select v-model="isNew" name="is-new" id="is-new">
          <md-option :value=true>Yes</md-option>
          <md-option :value=false>No</md-option>
        </md-select>
      </md-field>
      <md-field v-if="selectedFilters.includes('user')" style="max-width: 100%;">
        <label>Curating User</label>
        <md-input v-model="user"></md-input>
      </md-field>

    </template>

    <template #action_buttons>
    <md-field>
      <label for="filterBy">Filter by...</label>
      <md-select v-model="selectedFilters" name="filterBy" id="filterBy" multiple>
        <md-option value="apprStatus">Admin Approval Status</md-option>
        <md-option value="curationState">Curation State</md-option>
        <md-option value="user">Curating User</md-option>
        <md-option value="isNew">Is New</md-option>
      </md-select>
    </md-field>
      <button
        type="submit"
        class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
        @click.prevent="submitSearch"
      >
      Search Xml
      </button>
      <button v-if="searchEnabled"
        type="submit"
        class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
        @click.prevent="customReset('XML')"
      >
      Clear Search
      </button>
    </template>

    <template #page_input>
      <input type="number" id="pagesize" class="u_width--xs utility-navfont" name="pagesize" v-model.lazy="pageSize" min="1" max="20">
    </template>

    <template v-if="!!Object.keys(xmlFinder).length && !!xmlFinder.xmlData.length">
      <md-card v-for="(xml, index) in xmlFinder.xmlData" :key="index" class="btn--animated gallery-item">
        <router-link :to="{ name: 'XmlVisualizer', params: { id: xml.id }, query: { isNewCuration: `${xml.isNewCuration}` }}">
          <md-card-media-cover md-solid>
            <md-card-media md-ratio="4:3">
              <md-icon class="explorer_page-nav-card_icon u_margin-top-small">code_off</md-icon>
            </md-card-media>
            <md-card-area class="u_gridbg">
              <md-card-header class="u_show_hide">
                <span class="md-subheading">
                  <strong>{{ xml.title ?? '' }}</strong>
                </span>
              <span class="md-body-1">Click to view</span>
              </md-card-header>
            </md-card-area>
          </md-card-media-cover>
        </router-link>
      </md-card>
    </template>

    <template #pagination>
      <pagination v-if="xmlFinder && xmlFinder.xmlData"
        :cpage="pageNumber"
        :tpages="xmlFinder.totalPages || 1"
        @go-to-page="loadPrevNextImage($event)"
      />
    </template>

    <template #errorMessage>{{ !!error ? 'Cannot Load Xml List' : 'Sorry! No Xml Found' }}</template>

  </search-gallery>
</template>

<script>
import pagination from '@/components/explorer/Pagination'
import { XML_FINDER } from '../../../modules/gql/xml-gql'
import explorerQueryParams from '@/mixins/explorerQueryParams'
import SearchGallery from '@/components/XmlSearchUtil'
export default {
  name: 'XmlGallery',
  data () {
    return {
      baseUrl: window.location.origin,
      renderText: 'Showing all XML',
      xmlFinder: [],
      pageNumber: 1,
      pageSize: 20,
      searchEnabled: false,
      searchWord: '',
      selectedFilters: [],
      apprStatus: null,
      curationState: null,
      user: null,
      isNew: null,
      filterParams: {},
      error: null
    }
  },
  mixins: [explorerQueryParams],
  components: {
    SearchGallery,
    pagination
  },
  computed: {
    isEmpty () {
      if (this.xmlFinder.length === 0 || !Object.keys(this.xmlFinder).length || this.xmlFinder.totalItems === 0) return true
      return false
    },
    filtersActive () {
      return !!this.apprStatus || !!this.curationState || !!this.user || (this.isNew !== null)
    }
  },
  methods: {
    async localSearchMethod () {
      // TODO @aswallace: Update to user query params instead
      this.filterParams = {
        isNewCuration: this.selectedFilters.includes('isNew') ? this.isNew : null,
        status: this.selectedFilters.includes('apprStatus') ? this.apprStatus : null,
        curationState: this.selectedFilters.includes('curationState') ? this.curationState : null,
        user: this.selectedFilters.includes('user') ? this.user : null
      }
      await this.$apollo.queries.xmlFinder.refetch()
    },
    async submitSearch () {
      if (!this.searchWord && !this.filtersActive) {
        return this.$store.commit('setSnackbar', {
          message: 'Enter a XML sample file name or select a filter type',
          duration: 10000
        })
      }
      this.searchEnabled = !!this.searchWord || !!this.filtersActive
      this.pageNumber = 1
      return await this.updateParamsAndCall(true)
    },
    async customReset (type) {
      this.apprStatus = null
      this.curationState = null
      this.user = null
      this.isNew = null
      this.selectedFilters = []
      this.filterParams = {}
      await this.resetSearch(type)
    }
  },
  created () {
    const query = this.$route.query
    if (query?.page || query?.size || query?.q) {
      return this.loadParams(this.$route.query)
    }
  },
  apollo: {
    xmlFinder: {
      query: XML_FINDER,
      variables () {
        return {
          input: {
            pageNumber: this.pageNumber,
            pageSize: parseInt(this.pageSize),
            filter: { param: this.$route.query?.q, ...this.filterParams }
          }
        }
      },
      fetchPolicy: 'cache-and-network',
      error (error) {
        if (error.networkError) {
          const err = error.networkError
          this.error = `Network Error: ${err?.response?.status} ${err?.response?.statusText}`
        } else if (error.graphQLErrors) {
          this.error = error.graphQLErrors
        }
        this.$store.commit('setSnackbar', {
          message: this.error,
          duration: 10000
        })
      }
    }
  }
}
</script>
