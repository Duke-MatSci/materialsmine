<template>
  <div class="gallery">
		<facet-panel class="facet_panel" filterType="IMAGE" />
    <div class="section_loader" v-if="$apollo.loading">
      <spinner :loading="$apollo.loading" text='Loading Images'/>
    </div>
    <div class="utility-roverflow" v-else>
			<div class="u_content__result">
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
        </span>
			</div>
			<div class="gallery-grid grid grid_col-5">
        <md-card
          v-for="(image, index) in searchImages.images || images.images"
          :key="index"
          class="btn--animated gallery-item"
        >
          <router-link :to="{ name: 'ImageView', params: { id: image.metaData.id }}">
            <md-card-media-cover md-solid>
              <md-card-media md-ratio="4:3">
                <img
									:src="image.file"
									:alt="image.metaData.title"
                >
              </md-card-media>
              <md-card-area class="u_gridbg">
                <md-card-header class="u_show_hide">
                  <span class="md-subheading">
                    <strong>{{ image.description || 'polymer nanocomposite image' }}</strong>
                  </span>
                  <span class="md-body-1">{{ image.metaData.title }}</span>
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
      console.log(this.imageSearch.value)
      if (!this.searchEnabled) {
        this.pageNumber = event
        this.$apollo.queries.images
      }
      this.pageNumber = event
      this.$apollo.queries.searchImages.skip = false
      this.$apollo.queries.searchImages
    }
  },
  apollo: {
    images: {
      query: IMAGES_QUERY,
      variables () {
        return {
          input: { pageNumber: this.pageNumber, pageSize: this.pageSize }
        }
    	},
      fetchPolicy: 'cache-and-network',
    },
    searchImages: {
      query: SEARCH_IMAGES_QUERY,
      variables () {
        return {
          input: { search: this.imageSearch.type, searchValue: this.imageSearch.value, pageNumber: this.pageNumber, pageSize: this.pageSize }
        }
    	},
      skip () {
      	return this.skipQuery
    	},
      fetchPolicy: 'cache-and-network',
    }
  }
}
</script>
