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
            <div v-if="isAuth && isAdmin" @click.prevent="editChart(result)">
              <md-icon>edit</md-icon>
            </div>
            <div v-if="isAuth && isAdmin" @click.prevent="renderDialog('Delete Chart?', 'delete', result, 80)">
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
        @go-to-page="loadPrevNextImage($event)"
      />
    </div>
    <dialogbox :active="dialogBoxActive" :minWidth="dialog.minWidth">
      <template v-slot:title>{{dialog.title}}</template>
      <template v-slot:content>
        <div v-if="dialog.type=='delete'">
          <md-content v-if="dialog.chart">
            <div> This will permanently remove the chart <b>{{dialog.chart.label}}</b> </div>
            with identifier <b>{{dialog.chart.identifier}}</b>.
          </md-content>
        </div>
        <div v-if="dialogLoading">
          <spinner
            :loading="dialogLoading"
            text='Deleting Chart'
          />
        </div>
      </template>
      <template v-slot:actions>
        <span v-if="dialog.type=='delete' && dialog.chart">
          <md-button @click.native.prevent="toggleDialogBox">
            No, cancel
          </md-button>
          <md-button @click.native.prevent="deleteChart(dialog.chart)">
            Yes, delete.
          </md-button>
        </span>
        <md-button v-else @click.native.prevent="toggleDialogBox">Close</md-button>
      </template>
    </dialogbox>
  </div>
</template>
<script>
import spinner from '@/components/Spinner'
import pagination from '@/components/explorer/Pagination'
import Dialog from '@/components/Dialog.vue'
import defaultImg from '@/assets/img/rdf_flyer.svg'
import { toChartId } from '@/modules/vega-chart'
import { mapGetters, mapActions, mapMutations } from 'vuex'
import reducer from '@/mixins/reduce'
import explorerQueryParams from '@/mixins/explorerQueryParams'

export default {
  name: 'viz-grid',
  mixins: [reducer, explorerQueryParams],
  data () {
    return {
      loading: true,
      loadError: false,
      otherArgs: null,
      pageNumber: 1,
      defaultImg,
      baseUrl: `${window.location.origin}/api/knowledge/images?uri=`,
      dialog: {
        title: 'Test'
      },
      dialogLoading: false
    }
  },
  components: {
    pagination,
    spinner,
    dialogbox: Dialog
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox',
      isAuth: 'auth/isAuthenticated',
      isAdmin: 'auth/isAdmin',
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
    ...mapMutations({ toggleDialogBox: 'setDialogBox' }),
    renderDialog (title, type, result, minWidth) {
      this.dialog = {
        title,
        type,
        minWidth,
        chart: result
      }
      this.toggleDialogBox()
    },
    async deleteChart (chart) {
      if (!this.isAdmin) return // temporary safeguard
      this.dialogLoading = true
      await this.$store.dispatch('explorer/curation/deleteChartNanopub', chart.identifier)
      await this.$store.dispatch('explorer/curation/deleteChartES', chart.identifier)
      this.toggleDialogBox()
      this.dialogLoading = false
      await this.loadItems()
    },
    editChart (chart) {
      return this.$router.push(`/explorer/chart/editor/edit/${this.getChartId(chart)}`)
    },
    bookmark () {
      // TODO
    },
    async localSearchMethod () {
      await this.loadItems(this.pageNumber)
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
    const query = this.$route.query
    if (query?.page) {
      await this.loadParams(this.$route.query, false)
    } else {
      await this.loadItems()
    }
  },
  watch: {
    newChartExist () {
      this.$store.commit('explorer/curation/setNewChartExist', false)
      return this.loadItems()
    }
  }
}
</script>
