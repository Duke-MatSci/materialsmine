<template>
  <div class="gallery">
    <div class="section_loader" v-if="loading">
      <spinner
        :loading="loading"
        text='Loading Charts'
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
          <div class="u_gridicon">
            <div
              @click.prevent="bookmark(result.name, true)"
              v-if="result.bookmark"
            >
              <md-icon>bookmark</md-icon>
            </div>
            <div
              @click.prevent="bookmark(result.name, false)"
              v-else
            >
              <md-icon>bookmark_border</md-icon>
            </div>
            <div v-if="$store.getters.isAuthenticated && !!$store.getters.user.isAdmin" @click.prevent="deleteChart(result)">
              <md-icon>delete_outline</md-icon>
            </div>
          </div>
          <router-link v-if="result.identifier" :to="{ name: 'ChartView', params: { chartId: getChartId(result) }}">
            <md-card-media-cover md-solid>
              <md-card-media md-ratio="4:3">
                <img
                  :src="baseUrl + result.thumbnail"
                  :alt="result.label"
                  v-if="result.thumbnail"
                >
                <img
                  :src="defaultImg"
                  :alt="result.label"
                  v-else
                >
              </md-card-media>
              <md-card-area class="u_gridbg">
                <md-card-header class="u_show_hide">
                  <span class="md-subheading">
                    <strong>{{ result.label }}</strong>
                  </span>
                  <span class="md-body-1">{{ reduceDescription(result.description, 15) }}</span>
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
import { mapGetters, mapActions } from 'vuex'
import reducer from '@/mixins/reduce'

export default {
  name: 'viz-grid',
  mixins: [reducer],
  data () {
    return {
      loading: true,
      loadError: false,
      otherArgs: null,
      defaultImg,
      baseUrl: 'http://localhost/api/knowledge/images?uri='
    }
  },
  components: {
    pagination,
    spinner
  },
  computed: {
    ...mapGetters({
      items: 'explorer/gallery/items',
      page: 'explorer/gallery/page',
      total: 'explorer/gallery/total',
      totalPages: 'explorer/gallery/totalPages',
      queryTimeMillis: 'explorer/gallery/queryTimeMillis',
      newChartExist: 'explorer/curation/getNewChartExist'
    })
  },
  methods: {
    ...mapActions('explorer/gallery', ['loadItems']),
    deleteChart (chart) {

      // console.log('delete chart', chart)
    },
    async loadItems (page = 1) {
      this.loading = true
      await this.$store.dispatch('explorer/gallery/loadItems', { page })
      this.loading = false
    },
    getChartId (chart) {
      return toChartId(chart.identifier)
    }
  },
  async mounted () {
    await this.loadItems()
  },
  watch: {
    newChartExist () {
      this.$store.commit('explorer/curation/setNewChartExist', false)
      return this.loadItems()
    }
  }
}
</script>
