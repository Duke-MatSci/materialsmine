<template>
  <div class="gallery">
		<facet-panel class="facet_panel" filterType="IMAGE" />
    <div class="section_loader" v-if="$apollo.loading">
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
              v-model="pageSize"
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
                    <strong>{{ reduceDescription(image.description, 2) || 'polymer nanocomposite...' }}</strong>
                  </span>
                 <span class="md-body-1">{{ reduceDescription(image.metaData.title, 15) }}</span>
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
import FacetPanel from '@/components/explorer/Facet.vue'
export default {
  name: 'ImageGallery',
  data () {
    return {
      baseUrl: window.location.origin,
      renderText: 'Showing all images',
      images: [],
      searchImages: [],
      ImageList: [],
      pageNumber: 1,
      pageSize: 20,
      searchEnabled: false
    }
  },
  components: {
    pagination,
    spinner,
    FacetPanel
  },
  computed: {
    imageSearch () {
      return this.$store.getters['explorer/getSelectedFacetFilterMaterialsValue']
    }
  },
  watch: {
    imageSearch (newValue, oldValues) {
      if (newValue && newValue.value.length) {
        this.renderText = `Showing ${newValue.type}: ${newValue.value}`
        this.searchEnabled = true
        this.loadPrevNextImage(1)
      } else {
        this.$router.go(this.$router.currentRoute)
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
    reduceDescription (args, size) {
      if (args) {
        const arr = args.split(' ')
        const sliced = arr.slice(0, size).join(' ')
        return arr.length > size ? `${sliced}...` : sliced
      }
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
