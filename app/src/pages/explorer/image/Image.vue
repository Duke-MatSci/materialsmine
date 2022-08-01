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
          <ul class="contactus_radios u--margin-neg u_centralize_text">
            <li>
              <div class="form__radio-group">
                <input type="radio" class="form__radio-input"
                value="filterByFiller" id="filterByFiller" name="question" v-model="filter">
                <label for="filterByFiller" class="form__radio-label">
                  <span class="form__radio-button form__radio-button_less"></span>
                  Search by filler
                </label>
              </div>
            </li>
            <li>
              <div class="form__radio-group">
                <input type="radio" class="form__radio-input" id="filterByKeyword"
                value="filterByKeyword" name="question" v-model="filter">
                <label for="filterByKeyword" class="form__radio-label">
                  <span class="form__radio-button form__radio-button_less"></span>
                  Search by keyword
                </label>
              </div>
            </li>
            <li>
              <div class="form__radio-group">
                <input type="radio" class="form__radio-input" id="filterByYear"
                value="filterByYear" name="question" v-model="filter">
                <label for="filterByYear" class="form__radio-label">
                  <span class="form__radio-button form__radio-button_less"></span>
                  Search by year
                </label>
              </div>
            </li>
          </ul>
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
              @click.prevent="cancelSearch"
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
        :cpage="searchImages.pageNumber || images.pageNumber"
        :tpages="searchImages.totalPages || images.totalPages"
        @go-to-page="loadPrevNextImage($event)"
      />
		</div>
    <div v-else class="utility-roverflow u_centralize_text u_margin-top-med">
      <h1 class="visualize_header-h1 u_margin-top-med">Cannot Load Images!!!</h1>
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
      pageNumber: 1,
      pageSize: 20,
      searchEnabled: false,
      filter: '',
      searchWord: ''
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
        this.loadPrevNextImage(1)
      }
    }
  },
  methods: {
    loadPrevNextImage (event) {
      if (!this.searchEnabled) {
        this.pageNumber = event
        this.$apollo.queries.images.refetch()
        return
      }
      this.pageNumber = event
      this.$apollo.queries.images.skip = true
      this.$apollo.queries.searchImages.skip = false
      this.$apollo.queries.searchImages.refetch()
    },
    submitSearch () {
      if (!this.searchWord && !this.filter) return
      return this.dispatchSearch()
    },
    async cancelSearch () {
      this.$router.go(this.$router.currentRoute)
    },
    async dispatchSearch () {
      await this.$store.commit('explorer/setSelectedFacetFilterMaterialsValue',
        { type: this.filter, value: this.searchWord })
    }
  },
  created () {
    if (this.imageSearch?.value) {
      this.searchEnabled = true
      this.filter = this.imageSearch?.type
      this.searchWord = this.imageSearch?.value
      this.loadPrevNextImage(1)
    }
  },
  apollo: {
    images: {
      query: IMAGES_QUERY,
      variables () {
        return {
          input: { pageNumber: this.pageNumber, pageSize: parseInt(this.pageSize) }
        }
      },
      fetchPolicy: 'cache-and-network'
    },
    searchImages: {
      query: SEARCH_IMAGES_QUERY,
      variables () {
        return {
          input: { search: this.imageSearch.type, searchValue: this.imageSearch.value, pageNumber: this.pageNumber, pageSize: parseInt(this.pageSize) }
        }
      },
      skip () {
        if (!this.searchEnabled) return this.skipQuery
      },
      fetchPolicy: 'cache-and-network'
    }
  }
}
</script>
