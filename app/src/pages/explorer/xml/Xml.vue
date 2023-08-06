<template>
  <search-gallery :isEmpty="isEmpty" :totalItems="xmlFinder.totalItems || 0" :loading="$apollo.loading" :error="!!error">
    <template #search_input>
      <input type="text" ref="search_input" class="form__input form__input--flat"
        placeholder="Search XML" name="search" id="search"
        required v-model="searchWord" />
    </template>

    <template #action_buttons>
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
        @click.prevent="resetSearch('XML')"
      >
      Clear Search
      </button>
    </template>

    <template #page_input>
      <input type="number" id="pagesize" class="u_width--xs utility-navfont" name="pagesize" v-model.lazy="pageSize" min="1" max="20">
    </template>

    <template v-if="!!Object.keys(xmlFinder).length && !!xmlFinder.xmlData.length">
      <md-card v-for="(xml, index) in xmlFinder.xmlData" :key="index" class="btn--animated gallery-item">
        <router-link :to="{ name: 'XmlVisualizer', params: { id: xml.id }}">
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
    }
  },
  methods: {
    async localSearchMethod () {
      await this.$apollo.queries.xmlFinder.refetch()
    },
    async submitSearch () {
      if (!this.searchWord) {
        return this.$store.commit('setSnackbar', {
          message: 'Enter a XML sample file name',
          duration: 10000
        })
      }
      this.searchEnabled = !!this.searchWord
      this.pageNumber = 1
      return await this.updateParamsAndCall(true)
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
          input: { pageNumber: this.pageNumber, pageSize: parseInt(this.pageSize), param: this.$route.query?.q }
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
