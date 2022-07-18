<template>
  <div class="gallery">
    <spinner
      :loading="getIsloading"
      text='Loading...'
      v-if="getIsloading"
    />
    <div
      class="utility-roverflow explorer_page-results"
      v-else
    >
      <!-- Articles -->
      <div v-if="resultsTab==='getArticles'" class="grid_explorer-fullrow">
        <div v-for="(result, index) in getArticles"
          :key="index"
          class="btn--animated md-card gallery-item results_card">
          <md-card-header style="padding:0px">
            <router-link @click.native="fixUriBeforeRouting(result.identifier, 'http://dx.doi.org/')" to="#" class="results_card-title">
              <div >{{ result.label }}</div>
            </router-link>
            <div>
              <div class="results_card-type">Articles</div>
              <div class="md-body-1 results_card-description" >
                  {{ result.identifier }}
              </div>
            </div>
          </md-card-header>
        </div>

      </div>

      <!-- Samples -->
      <div class="grid_explorer-fullrow" v-if="resultsTab === 'getSamples'">
        <div v-for="(result, index) in getSamples"
          :key="index"
          class="btn--animated md-card gallery-item results_card">

          <md-card-header style="padding:0px">
            <md-avatar v-if="result.thumbnail">
              <img
                :src="getThumbnailUrl(result)"
                :alt="result.label"
                v-if="result.thumbnail"
              >
            </md-avatar>

            <router-link  @click.native="fixUriBeforeRouting(result.identifier, 'http://materialsmine.org/sample/')" to="#"  class="results_card-title">
              <div >{{ result.label }}</div>
            </router-link>
            <div >
              <div class="results_card-type">Samples</div>
              <div class="md-body-1 results_card-description" v-if="result.description" >
                  {{ reduceDescription(result.description) }}
              </div>
              <div class="md-body-1 results_card-description" v-else-if="result.identifier" >
                  {{ result.identifier }}
              </div>
            </div>
          </md-card-header>
        </div>

      </div>

      <!-- Charts -->
      <div class="grid_explorer-boxes" v-if="resultsTab === 'getCharts'">
        <div v-for="(result, index) in getCharts"
          :key="index"
          class="btn--animated md-card gallery-item results_card">

          <div class="utility-gridicon_explorer" v-if="resultsTab === 'getCharts'">
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
          </div>

          <md-card-media-cover md-solid>
            <md-card-media md-ratio="4:3"  v-if="result.thumbnail">
              <img
                :src="getThumbnailUrl(result)"
                :alt="result.label"
                v-if="result.thumbnail"
              >
            </md-card-media>
            <md-icon v-else class="md-size-5x"> image </md-icon>
          </md-card-media-cover>

          <md-card-header style="padding:0px">
            <router-link @click.native="fixUriBeforeRouting(result.identifier, 'http://nanomine.org/viz/')" to="#" class="results_card-title">
              <div >{{ result.label }}</div>
            </router-link>
          </md-card-header>
        </div>

      </div>

      <!-- Images -->
      <div class="grid_explorer-boxes" v-if="resultsTab === 'getImages'">
        <div v-for="(result, index) in getImages"
          :key="index"
          class="btn--animated md-card gallery-item results_card">
          <md-card-media-cover md-solid>
            <md-card-media md-ratio="4:3"  v-if="result.file">
              <img
                :src="baseUrl + result.file"
                :alt="result.label"
                v-if="result.metaData.title"
              >
            </md-card-media>
            <md-icon v-else class="md-size-5x"> image </md-icon>
          </md-card-media-cover>

          <md-card-header style="padding:0px">
            <router-link @click.native="fixUriBeforeRouting(result.metaData.id, result.file)" to="#" class="results_card-title">
              <div >{{ result.description || 'Image' }}</div>
            </router-link>
          </md-card-header>
        </div>
      </div>

        <!-- Materials -->
      <div class="grid_explorer-fullrow" v-if="resultsTab === 'getMaterials'">
        <div v-for="(result, index) in getMaterials"
          :key="index"
          class="btn--animated md-card gallery-item results_card">
          <md-card-header style="padding:0px">
            <md-avatar v-if="resultsTab=='getMaterials' && result.thumbnail">
              <img
                :src="getThumbnailUrl(result)"
                :alt="result.label"
                v-if="result.thumbnail"
              >
            </md-avatar>
            <router-link :to="`/explorer/chart/view/${result.identifier}`"  class="results_card-title">
              <div >{{ result.label }}</div>
            </router-link>
            <div>
              <div class="results_card-type">Materials</div>
              <div class="md-body-1 results_card-description" v-if="result.description" >
                  {{ reduceDescription(result.description) }}
              </div>
              <div class="md-body-1 results_card-description" v-else-if="result.identifier" >
                  {{ result.identifier }}
              </div>
            </div>
          </md-card-header>
        </div>
      </div>

      <!-- New -->
      <!-- <div :class="(resultsTab =='getImages' || resultsTab== 'getCharts') ? 'grid_explorer-boxes' : 'grid_explorer-fullrow'">
        <div v-for="(result, index) in getArticles"
          :key="index"
          class="btn--animated md-card gallery-item results_card">

          <div class="utility-gridicon_explorer" v-if="resultsTab === 'getCharts'">
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
          </div>

          <md-card-media-cover
            v-if="resultsTab=='getImages' || resultsTab== 'getCharts'"
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
          </md-card-media-cover>

          <md-card-header style="padding:0px">
            <md-avatar v-if="resultsTab=='Samples' && result.thumbnail">
              <img
                :src="getThumbnailUrl(result)"
                :alt="result.label"
                v-if="result.thumbnail"
              >
            </md-avatar>
            <router-link @click.native="fixUriBeforeRouting(result.identifier)" to="#"
            class="results_card-title" v-if="resultsTab === 'getArticles'">
              <div >{{ result.label }}</div>
            </router-link>

            <router-link @click.native="fixUriBeforeRouting(result.identifier)" to="#"
            class="results_card-title" v-if="resultsTab === 'getSamples'">
              <div >{{ result.label }}</div>
            </router-link>

            <router-link :to="`/explorer/chart/view/${result.identifier}`"  class="results_card-title">
              <div >{{ result.label }}</div>
            </router-link>
            <div v-if="resultsTab !== 'getImages' && resultsTab !=='getCharts'">
              <div class="results_card-type">{{resultsTab}}</div>
              <div class="md-body-1 results_card-description" v-if="result.description" >
                  {{ reduceDescription(result.description) }}
              </div>
              <div class="md-body-1 results_card-description" v-else-if="result.identifier" >
                  {{ result.identifier }}
              </div>
            </div>
          </md-card-header>
        </div>
      </div> -->
      <!-- <pagination
        :cpage="page"
        :tpages="totalPages"
        @go-to-page="loadItems($event)"
      /> -->
    </div>
  </div>
</template>
<script>
import spinner from '@/components/Spinner'
import reducer from '@/mixins/reduce'
// import pagination from '@/components/explorer/Pagination'
import { getViewUrl } from '@/modules/whyis-view'
import { mapGetters } from 'vuex'

export default {
  name: 'search-results',
  mixins: [reducer],
  data () {
    return {
      loadError: false,
      otherArgs: null,
      defaultImg: '',
      baseUrl: window.location.origin
    }
  },
  components: {
    // pagination,
    spinner
  },
  computed: {
    ...mapGetters({
      resultsTab: 'explorer/getResultsTab',
      getArticles: 'explorer/results/getArticles',
      getSamples: 'explorer/results/getSamples',
      getImages: 'explorer/results/getImages',
      getCharts: 'explorer/results/getCharts',
      getMaterials: 'explorer/results/getMaterials',
      getTotal: 'explorer/results/getTotal',
      getIsloading: 'explorer/results/getIsloading'
    })
  },
  methods: {
    fixUriBeforeRouting (address, prefix) {
      if (address && prefix) {
        const identifier = address.replace(prefix, '')
        if (this.resultsTab === 'getArticles') {
          return this.$router.push(`/explorer/article/${identifier}`)
        } else if (this.resultsTab === 'getSamples') {
          return this.$router.push(`/explorer/sample/${identifier}`)
        } else if (this.resultsTab === 'getCharts') {
          return this.$router.push(`/explorer/chart/view/${identifier}`)
        } else if (this.resultsTab === 'getImages') {
          return this.$router.push(`/explorer/images/${address}/${encodeURIComponent(prefix)}`)
        }
      }
    },
    getThumbnailUrl (item) {
      return getViewUrl({ uri: item.thumbnail })
    }
  }
}
</script>
