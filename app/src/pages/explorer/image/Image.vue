<template>
  <div class="gallery">
    <div class="section_loader" v-if="loading">
      <spinner
        :loading="loading"
        text='Loading Images'
      />
    </div>
    <div
      class="utility-roverflow"
      v-else
    >
      <div class="u_content__result">
        <!-- TODO TIME TO RESULT -->
        <span class="u_color utility-navfont" id="css-adjust-navfont">
          <strong v-if="otherArgs != null">{{ otherArgs }}</strong>
          <span v-if="total === 0">
            No results
          </span>
          <span v-else-if="total === 1">
            1 result
          </span>
          <span v-else>
            About {{total}} results
          </span>
          ({{(queryTimeMillis/1000).toFixed(2)}} seconds)
        </span>
      </div>
      <div class="gallery-grid grid grid_col-5">
        <md-card
          v-for="(result, index) in items"
          :key="index"
          class="btn--animated gallery-item"
        >
          <router-link :to="{ name: 'ChartView', params: { chartId: getChartId(result) }}">
            <md-card-media-cover md-solid>
              <md-card-media md-ratio="4:3">
                <img
                    src="@/assets/img/acs_pub.jpg"
                    alt="image visualization"
                  v-if="result.thumbnail"
                >
                <img
                    src="@/assets/img/acs_pub.jpg"
                    alt="image visualization"
                  v-else
                >
              </md-card-media>
              <md-card-area class="u_gridbg">
                <md-card-header class="u_show_hide">
                  <span class="md-subheading">
                    <strong>Image visualization</strong>
                  </span>
                  <span class="md-body-1">MM Explorer is a research-focused discovery tool that enables collaboration among scholars of nano and meta materials. Browse or search information on articles, samples, images, charts, etc.</span>
                </md-card-header>
              </md-card-area>
            </md-card-media-cover>
          </router-link>
        </md-card>
      </div>
      <pagination
        :cpage="page"
        :tpages="totalPages"
        @go-to-page="loadItems($event)"
      />
    </div>
  </div>
</template>
<script>
import spinner from '@/components/Spinner'
import pagination from '@/components/explorer/Pagination'
import { IMAGES_QUERY } from '@/modules/gql/image-gql'
export default {
  name: 'ImageGallery',
  props: {
    authenticated: {
      type: Boolean,
      require: true
    },
    instancetype: {
      type: String,
      require: true
    }
  },
  data () {
    return {
      loading: true,
      loadError: false,
      otherArgs: null,
      imagesList: [],
      pageSize: 20,
      pageNumber: 1,
    }
  },
  components: {
    pagination,
    spinner
  },
  methods: {
    
  },
  async mounted () {
    await this.loadItems()
  },
  apollo: {
    imageList: {
      query: IMAGES_QUERY,
      varables() {
        return { pageNumber: this.pageNumber, pageSize: this.pageSize  }
      }
    }
  }
}
</script>
