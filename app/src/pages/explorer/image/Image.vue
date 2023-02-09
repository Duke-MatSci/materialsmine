<template>
  <div class="gallery">
    <div class="utility-roverflow u--margin-toplg">
      <div class="search_box card-icon-container u--margin-toplg">
        <form class="form" @submit.prevent="submitSearch" >
          <div class="search_box_form">
            <div class="form__group search_box_form-item-1">
              <input type="text" ref="search_input" class="form__input form__input--flat"
              placeholder="Search Microstructure Image" name="search" id="search"
              required v-model.lazy="searchWord" />
              <label htmlFor="search" class="form__label search_box_form_label">Search Microstructure Image</label>
            </div>
          </div>
          <div class="form__group">
            <div class="form__label">Filter by</div>
            <select class="form__select"
              v-model="filter" name="filter" id="filter">
              <option value="Keyword">Keyword</option>
              <option value="filterByFiller">Filler</option>
              <option value="filterByYear">Year</option>
              <option value="filterByDOI">DOI</option>
              <option value="filterByMicroscopy">Microscopy</option>
            </select>
          </div>
          <div class="form__group search_box_form-item-2  explorer_page-nav u--margin-neg">
            <button
              type="submit"
              class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
              @click.prevent="submitSearch()"
            >
            Search Images
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
    <div class="section_loader u--margin-toplg" v-if="$apollo.loading">
      <spinner :loading="$apollo.loading" text='Loading Images'/>
    </div>
    <div class="utility-roverflow" v-else-if="searchImages && searchImages.images || images && images.images">
			<div class="u_content__result u_margin-top-small">
				<span class="u_color utility-navfont" id="css-adjust-navfont">
          <strong v-if="renderText != null">{{ renderText }}</strong>
          <span v-if="searchImages.totalItems === 0 || images.totalItems === 0">
            No results
          </span>
          <span v-else-if="searchImages.totalItems === 1 || images.totalItems === 1">
            1 result
          </span>
          <span v-else>
            About {{searchImages.totalItems || images.totalItems}} results
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
			<div class="gallery-grid grid grid_col-5">
        <md-card
          v-for="(image, index) in searchImages.images || images.images"
          :key="index"
          class="btn--animated gallery-item"
        >
          <router-link :to="{ name: 'ImageDetailView', params: { id: image.metaData.id, fileId: image.file }}">
            <md-card-media-cover md-solid>
              <md-card-media md-ratio="4:3">
                <img
									:src="baseUrl + image.file"
									:alt="image.metaData.title"
                >
              </md-card-media>
              <md-card-area class="u_gridbg">
                <md-card-header class="u_show_hide">
                  <span class="md-subheading">
                    <strong>{{ reduceDescription(image.description || 'polymer nanocomposite', 2) }}</strong>
                  </span>
                 <span class="md-body-1">{{ reduceDescription(image.metaData.title || 'polymer nanocomposite', 15) }}</span>
                </md-card-header>
              </md-card-area>
            </md-card-media-cover>
          </router-link>
        </md-card>
      </div>
      <pagination
        :cpage="pageNumber"
        :tpages="searchImages.totalPages || images.totalPages"
        @go-to-page="loadPrevNextImage($event)"
      />
		</div>
    <div v-else class="utility-roverflow u_centralize_text u_margin-top-med">
      <h1 class="visualize_header-h1 u_margin-top-med">Cannot Load Images</h1>
    </div>
	</div>
</template>

<script>
import spinner from '@/components/Spinner'
import pagination from '@/components/explorer/Pagination'
import { IMAGES_QUERY, SEARCH_IMAGES_QUERY } from '@/modules/gql/image-gql'
import reducer from '@/mixins/reduce'
export default {
  name: 'ImageGallery',
  mixins: [reducer],
  data () {
    return {
      baseUrl: window.location.origin,
      renderText: 'Showing all images',
      images: [],
      searchImages: [],
      ImageList: [],
      pageNumber: parseInt(this.$route.query.page) || 1,
      pageSize: parseInt(this.$route.query.size) <= 20 ? parseInt(this.$route.query.size) : 20,
      searchEnabled: false,
      filter: '',
      searchWord: '',
      error: null
    }
  },
  components: {
    pagination,
    spinner
  },
  computed: {
    imageSearch () {
      return this.$store.getters['explorer/getSelectedFacetFilterMaterialsValue']
    }
  },
  watch: {
    imageSearch (newValue, oldValues) {
      if (newValue && newValue.value?.length) {
        this.renderText = `Showing ${newValue.type}: ${newValue.value}`
        this.searchEnabled = true
        this.pageSize = newValue.pageSize || this.pageSize
        return this.refetchApollo()
      } else {
        this.searchEnabled = false
        this.pageSize = newValue.pageSize || this.pageSize
        return this.refetchApollo()
      }
    },
    '$route.query' (newValue, oldValues) {
      this.pageNumber = parseInt(newValue.page) || 1
      this.pageSize = parseInt(newValue.size) || 20
      this.filter = newValue.type || ''
      this.searchWord = newValue.q || ''
      this.dispatchSearch()
    },
    // Limit page size for now
    pageSize (newValue, oldValue) {
      this.checkPageSize(newValue)
      this.loadPrevNextImage(this.pageNumber)
    }
  },
  methods: {
    loadPrevNextImage (event) {
      this.pageNumber = event
      if (!this.searchEnabled) {
        return this.changeRoute(event, this.pageSize)
      }
      this.changeRoute(event, this.pageSize, this.filter, this.searchWord)
    },
    refetchApollo () {
      this.error = ''
      if (this.searchEnabled) {
        this.$apollo.queries.images.skip = true
        this.$apollo.queries.searchImages.skip = false
        this.$apollo.queries.searchImages.refetch()
      } else {
        this.$apollo.queries.searchImages.skip = true
        this.$apollo.queries.images.skip = false
        this.$apollo.queries.images.refetch()
      }
    },
    submitSearch () {
      if (!this.searchWord || !this.filter) {
        return this.$store.commit('setSnackbar', {
          message: 'Enter a search term and select a filter type'
        })
      }
      this.pageNumber = 1
      this.dispatchSearch()
      this.changeRoute(this.pageNumber, this.pageSize, this.filter, this.searchWord)
    },
    async resetSearch () {
      this.$router.replace({ query: null })
      this.searchImages = []
      this.renderText = 'Showing all images'
    },
    async dispatchSearch () {
      await this.$store.commit('explorer/setSelectedFacetFilterMaterialsValue',
        { type: this.filter, value: this.searchWord, size: this.pageSize })
    },
    changeRoute (page = 1, size = 20, filter = '', query = '') {
      const curQuery = this.$route.query
      // Don't push change if same route to avoid error
      if (curQuery.page === page && curQuery.size === size && curQuery.type === filter && curQuery.q === query) {
        this.refetchApollo()
      } else if (filter === '' || query === '') {
        if (curQuery.page === page && curQuery.size === size) return this.refetchApollo()
        this.$router.push({ query: { page, size } })
      } else this.$router.push({ query: { page, size, type: filter, q: query } })
    },
    checkPageSize (page) {
      if (page > 20) {
        this.pageSize = 20
      } else if (page < 1) {
        this.pageSize = 1
      }
    }
  },
  created () {
    if (this.$route.pageSize) {
      this.checkPageSize(this.$route.pageSize)
    }
    if (this.$route.query.q && this.$route.query.type) {
      this.searchEnabled = true
      this.searchWord = this.$route.query.q
      this.filter = this.$route.query.type
      this.dispatchSearch()
    } else if (this.imageSearch?.value) {
      this.searchEnabled = true
      this.filter = this.imageSearch?.type
      this.searchWord = this.imageSearch?.value
      this.refetchApollo()
    } else {
      this.searchEnabled = false
      this.dispatchSearch()
    }
  },
  apollo: {
    images: {
      query: IMAGES_QUERY,
      variables () {
        return {
          input: { pageNumber: this.pageNumber, pageSize: parseInt(this.imageSearch.size) }
        }
      },
      skip () {
        if (this.searchEnabled) return this.skipQuery
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
    },
    searchImages: {
      query: SEARCH_IMAGES_QUERY,
      variables () {
        return {
          input: { search: this.imageSearch.type, searchValue: this.imageSearch.value, pageNumber: this.pageNumber, pageSize: parseInt(this.imageSearch.size) }
        }
      },
      skip () {
        if (!this.searchEnabled) return this.skipQuery
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
