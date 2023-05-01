<template>
  <div class="gallery">
    <div class="utility-roverflow u--margin-toplg">
      <div class="search_box card-icon-container u--margin-toplg">
        <form class="form">
          <div class="search_box_form">
            <div class="form__group search_box_form-item-1">
              <input type="text" ref="search_input" class="form__input form__input--flat"
              placeholder="Search XML" name="search" id="search"
              required v-model="searchWord" />
              <label htmlFor="search" class="form__label search_box_form_label">Search Xml</label>
            </div>
          </div>
          <div class="form__group search_box_form-item-2  explorer_page-nav u--margin-neg">
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
              @click.prevent="resetSearch"
            >
            Clear Search
            </button>
          </div>
        </form>
      </div>
    </div>
    <div class="utility-roverflow" >
			<div class="u_content__result u_margin-top-small">
				<span class="u_color utility-navfont" id="css-adjust-navfont">
          <strong v-if="xmlFinder.totalItems === 1">{{ renderText }}</strong>
          <strong v-if="xmlFinder.totalItems > 1">{{ renderText }}s</strong>
          <span v-if="!Object.keys(xmlFinder).length || xmlFinder.totalItems === 0 ">
            No results
          </span>
          <span v-else-if="xmlFinder.totalItems === 1">
            1 result
          </span>
          <span v-else>
            About {{xmlFinder.totalItems }} results
          </span>
          <span class="utility-absolute-input ">
            <label for="pagesize"><strong>Page size:</strong></label>
            <input
              placeholder="Enter page size"
              type="number"
              id="pagesize"
              class="u_width--xs utility-navfont"
              name="pagesize"
              title="specify number of items per size"
              v-model.lazy="pageSize"
              min="1" max="20"
            >
          </span>
        </span>
			</div>
			<div class="gallery-grid grid grid_col-5" v-if="!!Object.keys(xmlFinder).length && !!xmlFinder.xmlData.length">
        <md-card
          v-for="(xml, index) in xmlFinder.xmlData"
          :key="index"
          class="btn--animated gallery-item"
        >
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
      </div>

      <pagination
        :cpage="pageNumber"
        :tpages="xmlFinder.totalPages ?? 1"
        @go-to-page="loadPrevNextImage($event)"
      />
		</div>
    <div class="section_loader u--margin-toplg" v-if="$apollo.loading">
      <spinner :loading="$apollo.loading" text='Loading Xml List'/>
    </div>
    <div v-else-if="error" class="utility-roverflow u_centralize_text u_margin-top-med">
      <h1 class="visualize_header-h1 u_margin-top-med">Cannot Load Xml List</h1>
    </div>
	</div>
</template>

<script>
import spinner from '@/components/Spinner'
import pagination from '@/components/explorer/Pagination'
import { XML_FINDER } from '../../../modules/gql/xml-gql'
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
  components: {
    pagination,
    spinner
  },
  watch: {
    '$route.query' (newValue, oldValues) {
      if (newValue !== oldValues) {
        this.loadParams(newValue)
      }
    },
    pageSize (newValue, oldValue) {
      if (newValue !== oldValue) {
        this.checkPageSize(newValue)
        this.updateParamsAndCall(true)
      }
    }
  },
  methods: {
    async loadParams (query) {
      this.pageNumber = parseInt(query.page) ? +query.page : 1
      parseInt(query.size) ? this.checkPageSize(+query.size) : this.checkPageSize(20)
      query.q ? this.updateSearchWord(query.q) : this.updateSearchWord('')
      await this.updateParamsAndCall()
    },
    async updateParamsAndCall (pushNewRoute = false) {
      this.searchEnabled = !!this.searchWord
      if (pushNewRoute) {
        this.$router.push({
          query: {
            page: this.pageNumber,
            size: this.pageSize,
            q: this.searchWord
          }
        })
      }
      await this.$apollo.queries.xmlFinder.refetch()
    },
    async loadPrevNextImage (event) {
      this.pageNumber = event
      await this.updateParamsAndCall(true)
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
    },
    async resetSearch () {
      this.renderText = 'Showing all XMLs'
      await this.$router.replace({ query: {} })
      return await this.loadParams({})
    },
    checkPageSize (pageSize) {
      if (!pageSize || (pageSize && pageSize < 1)) {
        this.pageSize = 20
      } else if (pageSize && pageSize > 50) {
        this.pageSize = 20
      } else {
        this.pageSize = pageSize
      }
    },
    updateSearchWord (searchWord) {
      if (!searchWord && !searchWord.length > 0) this.searchEnabled = false
      this.searchWord = searchWord
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
