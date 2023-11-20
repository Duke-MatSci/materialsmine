<template>
  <div>
    <div class=" viz-u-mgup-sm utility-margin md-theme-default">
      <div class="md-card-header contactus_radios md-card-header-flex">
        <div class="md-card-header-text">
          <div class="md-body-1">
            Administrators can manage curations. Accepted actions include delete, approve, and update curated samples status
          </div>
        </div>
      </div>

    </div>
    <search-gallery :isEmpty="isEmpty" :totalItems="xmlFinder.totalItems || 0" :loading="$apollo.loading" :error="!!error"
      :dense="true">
      <template #search_input>
        <input type="text" ref="search_input" class="form__input form__input--flat" placeholder="Search XML" name="search"
          id="search" required v-model="searchWord" />
      </template>

      <template  #filter_inputs>
        <div v-if="selectedFilters.includes('apprStatus')" class="u--margin-rightsm">
          <md-chip class="u--bg u_margin-bottom-small" md-deletable @md-delete="removeChip('apprStatus')" >
            Admin Approval Status: {{ apprStatus  }}</md-chip>
        </div>

        <div v-if="selectedFilters.includes('curationState')" class="u--margin-rightsm">
          <md-chip class="u--bg u_margin-bottom-small" @md-delete="removeChip('curationState')" md-deletable>Curation State: {{ curationState }}</md-chip>
        </div>

        <div v-if="selectedFilters.includes('isNew')" class="u--margin-rightsm">
          <md-chip class="u--bg u_margin-bottom-small" @md-delete="removeChip('isNew')" md-deletable="">is New: {{ isNew }}</md-chip>
        </div>

        <md-field v-if="selectedFilters.includes('user')" style="max-width: 100%;">
          <label>Curating User</label>
          <md-input v-model="user"></md-input>
        </md-field>
      </template>

      <template #action_buttons>
        <div class="form__field md-field">
          <select @change="(e) => selectFilters(e)" class="form__select" name="filterBy" id="filterBy">
            <option value="" disabled selected>Filter by...</option>
            <option value="apprStatus::Approved">Admin Approval Status (Approved)</option>
            <option value="apprStatus::Not_Approved">Admin Approval Status (Not_Approved)</option>
            <option value="curationState::Edit">Editing State</option>
            <option value="curationState::Review">Reviewing State</option>
            <option value="curationState::Curated">Curated</option>
            <option value="user">Curating User</option>
            <option value="isNew::Yes">New curation</option>
            <option value="isNew::No">Old Curation</option>
          </select>
        </div>
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
        <input type="number" id="pagesize" class="u_width--xs utility-navfont" name="pagesize" v-model.lazy="pageSize"
          min="1" max="20">
      </template>

      <template v-if="!!Object.keys(xmlFinder).length && !!xmlFinder.xmlData.length && !error">
        <md-card v-for="(xml, index) in xmlFinder.xmlData" :key="index" class="btn--animated gallery-item viz-u-mgup-md u_margin-none">
          <router-link
            :to="{ name: 'XmlVisualizer', params: { id: xml.id }, query: { isNewCuration: `${xml.isNewCuration}` } }">
            <md-card-media-cover md-solid>
              <md-card-media md-ratio="4:3">
                <md-icon class="u--color-primary md-size-3x">code_off</md-icon>
              </md-card-media>
              <md-card-area class="u_gridbg">
                <div class="md-card-actions u_show_hide viz-u-display__show">
                  <span class="md-body-2">{{ xml.title || '' }} </span>
                  <span class="md-body-1">Click to view</span>
                </div>
              </md-card-area>
            </md-card-media-cover>
          </router-link>
        </md-card>
      </template>

      <template #pagination>
        <pagination v-if="xmlFinder && xmlFinder.xmlData" :cpage="pageNumber" :tpages="xmlFinder.totalPages || 1"
          @go-to-page="loadPrevNextImage($event)" />
      </template>

      <template #errorMessage>{{ !!error ? 'Cannot Load Xml List' : 'Sorry! No Xml Found' }}</template>

    </search-gallery>
  </div>
</template>

<script>
import pagination from '@/components/explorer/Pagination'
import { XML_FINDER } from '../../../modules/gql/xml-gql'
import explorerQueryParams from '@/mixins/explorerQueryParams'
import SearchGallery from '@/components/XmlSearchUtil'
export default {
  name: 'ManageCurations',
  components: {
    SearchGallery,
    pagination
  },
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
      const filterParams = {
        isNewCuration: this.selectedFilters.includes('isNew') ? this.isNew === 'Yes' : null,
        status: this.selectedFilters.includes('apprStatus') ? this.apprStatus : null,
        curationState: this.selectedFilters.includes('curationState') ? this.curationState : null,
        user: this.selectedFilters.includes('user') ? this.user : null
      }
      for (const key in filterParams) {
        if (filterParams[key] === null) delete filterParams[key]
      }
      this.filterParams = filterParams
      await this.$apollo.queries.xmlFinder.refetch()
    },
    async submitSearch () {
      if (!this.searchWord && !this.filtersActive) {
        return this.$store.commit('setSnackbar', {
          message: 'Enter a XML sample file name  or select a filter type',
          duration: 10000
        })
      }
      this.error = null
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
      this.error = null
      await this.resetSearch(type)
    },
    selectFilters (e) {
      const value = e.target.value
      const arrValue = value.split('::')
      if (!this.selectedFilters.includes(arrValue[0])) {
        this.selectedFilters.push(arrValue[0])
      }
      this[arrValue[0]] = arrValue[1] ? arrValue[1] : null
      e.target.value = ''
    },
    removeChip (str) {
      const index = this.selectedFilters.indexOf(str)
      if (index < 0) return
      this.selectedFilters.splice(index, 1) // 2nd parameter means remove one item only
      this[str] = null
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: '', name: 'Manage Curation' })
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
      result ({ data, loading }) {
        if (!loading && data) this.error = null
      },
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