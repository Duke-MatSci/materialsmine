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
import defaultImg from '@/assets/img/rdf_flyer.svg'
import { toChartId } from '@/modules/vega-chart'
import { getViewUrl } from '@/modules/whyis-view'
import { mapGetters, mapActions } from 'vuex'
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
      defaultImg
    }
  },
  components: {
    pagination,
    spinner
  },
  computed: {
    ...mapGetters('explorer/gallery', [
      'items',
      'page',
      'total',
      'totalPages',
      'queryTimeMillis'
    ])
  },
  methods: {
    ...mapActions('explorer/gallery', ['loadItems']),
    reduceDescription (args) {
      const arr = args.split(' ')
      arr.splice(15)
      const arrSplice = arr.reduce((a, b) => `${a} ${b}`, '')
      const res = arrSplice.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return `${res}...`
    },
    deleteChart (chart) {
      console.log('delete chart', chart)
    },
    async loadItems (page = 1) {
      this.loading = true
      await this.$store.dispatch('explorer/gallery/loadItems', { page })
      this.loading = false
    },
    getThumbnailUrl (item) {
      return getViewUrl({ uri: item.thumbnail })
    },
    getChartId (chart) {
      return toChartId(chart.identifier)
    }
  },
  async mounted () {
    console.log('mounting images')
    await this.loadItems()
  }
}
</script>
