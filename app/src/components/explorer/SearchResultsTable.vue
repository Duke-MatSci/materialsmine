<template>
  <div class="gallery">
    <spinner
      :loading="loading"
      text='Loading...'
      v-if="loading"
    />
    <div
      class="utility-roverflow explorer_page-results"
      v-else
    >
      <div :class="(resultsTab =='Images' || resultsTab== 'Charts') ? 'grid_explorer-boxes' : 'grid_explorer-fullrow'">
        <div
          v-for="(result, index) in items"
          :key="index"
          class="btn--animated gallery-item results_card"
        >
          <!-- <div class="utility-gridicon">
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
          </div> -->

          <router-link :to="`/explorer/chart/view/${result.id}`">
            <md-card-media-cover
              v-if="resultsTab=='Images' || resultsTab== 'Charts'"
              md-solid
            >
              <md-card-media md-ratio="4:3"  v-if="result.thumbnail">
                <img
                  :src="getThumbnailUrl(result)"
                  :alt="result.label"
                  v-if="result.thumbnail"
                >
              </md-card-media>
              <md-icon v-else class="md-size-5x"> image </md-icon>
              <!-- <md-card-area class="u_gridbg">
                <md-card-header class="u_show_hide">
                  <span class="md-subheading">
                    <strong>{{ result.label }}</strong>
                  </span>
                  <span class="md-body-1">{{ reduceDescription(result.description) }}</span>
                </md-card-header>
              </md-card-area> -->
            </md-card-media-cover>
            <div class="results_card-title">{{ result.label }}</div>
            <div class="results_card-type">Type</div>
            <div class="md-body-1 results_card-description" v-if="resultsTab !== 'Images' && resultsTab!=='Charts'">
                {{ reduceDescription(result.description) }}
            </div>
          </router-link>
        </div>
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
// import defaultImg from '@/assets/img/rdf_flyer.svg'
import { getViewUrl } from '@/modules/whyis-view'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'viz-grid',
  props: {
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
      defaultImg: ''
    }
  },
  components: {
    pagination,
    spinner
  },
  computed: {
    ...mapGetters('explorer/gallery', ['items', 'page', 'total', 'totalPages', 'queryTimeMillis']),
    ...mapGetters({ resultsTab: 'explorer/getResultsTab' })
  },
  methods: {
    ...mapActions('explorer/gallery', ['loadItems']),
    reduceDescription (args) {
      const arr = args.split(' ')
      arr.splice(50)
      const arrSplice = arr.reduce((a, b) => `${a} ${b}`, '')
      const res = arrSplice.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return `${res}...`
    },
    async loadItems (page = 1) {
      this.loading = true
      await this.$store.dispatch('explorer/gallery/loadItems', { page })
      this.loading = false
    },
    getThumbnailUrl (item) {
      return getViewUrl({ uri: item.thumbnail })
    }
  },
  async mounted () {
    await this.loadItems()
  }
}
</script>
