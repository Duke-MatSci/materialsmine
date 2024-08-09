<template>
  <div class="gallery">
    <div class="section_loader" v-if="loading">
      <spinner :loading="loading" text="Loading Charts" />
    </div>
    <div v-else>
      <div class="u_content__result">
        <!-- TODO TIME TO RESULT -->
        <span class="u_color utility-navfont" id="css-adjust-navfont">
          <strong v-if="otherArgs != null">{{ otherArgs }}</strong>
          <template v-if="isFavourite">
            <span v-if="totalFavorites === 0"> No favorite results </span>
            <span v-else-if="totalFavorites === 1"> 1 favorite result </span>
            <span v-else> About {{ totalFavorites }} favorite results </span>
          </template>
          <template v-else>
            <span v-if="total === 0"> No results </span>
            <span v-else-if="total === 1"> 1 result </span>
            <span v-else> About {{ total }} results </span>
          </template>
          ({{ (queryTimeMillis / 1000).toFixed(2) }} seconds)
        </span>
      </div>
      <template v-if="!!galleryChartItems && !!galleryChartItems.length">
        <div
          :class="
            isFavourite
              ? 'gallery-grid grid grid_col-3'
              : 'gallery-grid grid grid_col-5'
          "
        >
          <md-card
            v-for="(result, index) in galleryChartItems"
            :key="index"
            class="btn--animated gallery-item"
          >
            <div class="u_gridicon">
              <div @click.prevent="bookmark(result, false)" v-if="isAuth">
                <md-icon>bookmark</md-icon>
                <md-tooltip md-direction="top"> Add to Favorites </md-tooltip>
              </div>
              <!-- <div @click.prevent="bookmark(result.name, false)" v-else>
                <md-icon>bookmark_border</md-icon>
              </div> -->
              <div v-if="isAuth" @click.prevent="editChart(result)">
                <md-icon>edit</md-icon>
                <md-tooltip md-direction="top">Edit </md-tooltip>
              </div>
              <div
                v-if="isAuth && isAdmin"
                @click.prevent="
                  renderDialog('Delete Chart?', 'delete', result, 80)
                "
              >
                <md-icon>delete_outline</md-icon>
              </div>
            </div>
            <router-link
              v-if="result.identifier"
              :to="{
                name: 'ChartView',
                params: { chartId: getChartId(result) }
              }"
            >
              <md-card-media-cover md-solid>
                <md-card-media md-ratio="4:3">
                  <img
                    :src="baseUrl + result.thumbnail"
                    :alt="result.label"
                    v-if="result.thumbnail"
                  />
                  <img :src="defaultImg" :alt="result.label" v-else />
                </md-card-media>
                <md-card-area class="u_gridbg">
                  <md-card-header class="u_show_hide">
                    <span class="md-subheading">
                      <strong>{{ result.label }}</strong>
                    </span>
                    <span class="md-body-1">{{
                      reduceDescription(result.description, 15)
                    }}</span>
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
      </template>
      <div
        class="utility-roverflow u_centralize_text u_margin-top-med section_loader"
        v-else
      >
        <!-- <div class="u_display-flex spinner"></div> -->
        <h1 class="visualize_header-h1 u_margin-top-med">No Charts Exist...</h1>
      </div>
    </div>
    <dialogbox :active="dialogBoxActive" :minWidth="dialog.minWidth">
      <template v-slot:title>{{ dialog.title }}</template>
      <template v-slot:content>
        <div v-if="dialog.type == 'delete'">
          <md-content v-if="dialog.chart">
            <div>
              This will permanently remove the chart
              <b>{{ dialog.chart.label }}</b>
            </div>
            with identifier <b>{{ dialog.chart.identifier }}</b>
          </md-content>
        </div>
        <div v-if="dialog.type == 'missingChart'">
          <md-content>
            <div>{{ formatText }}</div>
          </md-content>
        </div>
        <div v-if="dialogLoading">
          <spinner :loading="dialogLoading" text="Deleting Chart" />
        </div>
      </template>
      <template v-slot:actions>
        <span v-if="dialog.type == 'delete' && dialog.chart">
          <md-button @click.native.prevent="toggleDialogBox">
            No, cancel
          </md-button>
          <md-button @click.native.prevent="deleteChart(dialog.chart)">
            Yes, delete.
          </md-button>
        </span>
        <md-button v-else @click.native.prevent="toggleDialogBox"
          >Close</md-button
        >
      </template>
    </dialogbox>
  </div>
</template>

<script>
import spinner from '@/components/Spinner';
import pagination from '@/components/explorer/Pagination';
import Dialog from '@/components/Dialog.vue';
import defaultImg from '@/assets/img/rdf_flyer.svg';
import { toChartId } from '@/modules/vega-chart';
import { mapGetters, mapActions, mapMutations } from 'vuex';
import reducer from '@/mixins/reduce';
import explorerQueryParams from '@/mixins/explorerQueryParams';

export default {
  name: 'ChartGallery',
  mixins: [reducer, explorerQueryParams],
  props: {
    sender: {
      type: String,
      default: () => 'Visualization Gallery'
    },
    isFavourite: {
      type: Boolean,
      default: () => false
    }
  },
  data() {
    return {
      loading: false,
      loadError: false,
      otherArgs: null,
      pageNumber: 1,
      defaultImg,
      baseUrl: `${window.location.origin}/api/knowledge/images?uri=`,
      dialog: {
        title: 'Test'
      },
      dialogLoading: false
    };
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
      newChartExist: 'explorer/curation/getNewChartExist',
      favoriteChartItems: 'explorer/gallery/favoriteChartItems',
      totalFavorites: 'explorer/gallery/totalFavorites',
      missingCharts: 'explorer/gallery/missingCharts'
    }),
    galleryChartItems() {
      if (!this.isFavourite) {
        return this.items;
      } else {
        return this.favoriteChartItems;
      }
    }
  },
  methods: {
    ...mapActions('explorer/gallery', [
      'loadItems',
      'bookmarkChart',
      'fetchFavoriteCharts'
    ]),
    ...mapMutations({ toggleDialogBox: 'setDialogBox' }),
    renderDialog(title, type, result, minWidth) {
      this.dialog = {
        title,
        type,
        minWidth,
        chart: result
      };
      this.toggleDialogBox();
    },
    async deleteChart(chart, retry = false) {
      try {
        if (!this.isAdmin) return; // temporary safeguard

        // Retry is a flag to determine if the function is called from retry action
        if (!retry) {
          this.dialogLoading = true;
        }
        await this.$store.dispatch(
          'explorer/curation/deleteEntityNanopub',
          chart.identifier
        );
        await this.$store.dispatch('explorer/curation/deleteEntityES', {
          identifier: chart.identifier,
          type: 'charts'
        });
        await this.loadItems();
        if (!retry) {
          this.toggleDialogBox();
          this.dialogLoading = false;
        }
        return;
      } catch (error) {
        if (!retry) {
          this.toggleDialogBox();
          this.dialogLoading = false;
        }
        this.$store.commit('setSnackbar', {
          message: error || 'Something went wrong',
          action: () => this.deleteChart(chart, true)
        });
      }
    },
    editChart(chart) {
      return this.$router.push(
        `/explorer/chart/editor/edit/${this.getChartId(chart)}`
      );
    },
    async bookmark(chart) {
      await this.bookmarkChart({ chart });
    },
    async localSearchMethod() {
      await this.loadItems(this.pageNumber);
    },
    async loadItems(page = 1) {
      try {
        this.loading = true;
        await this.$store.dispatch('explorer/gallery/loadItems', { page });
        this.loading = false;
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: error || 'Something went wrong',
          action: () => this.loadItems(page)
        });
        return (this.loading = false);
      }
    },
    getChartId(chart) {
      return toChartId(chart.identifier);
    },
    formatMissingFavouriteText() {
      const message = `${this.missingCharts.length} out of your favourite charts `;
      return this.missingCharts.length === 1
        ? `${message}is no longer available and has been removed from your favourite list.`
        : `${message}are no longer available and have been removed from your favourite list.`;
    },
    checkAndRenderDialog() {
      if (!this.missingCharts.length) return null;
      else this.renderDialog('Missing Charts', 'missingChart', '', 80);
    },
    async loadFavorites() {
      this.loading = true;
      if (!this.favoriteChartItems.length) {
        await this.fetchFavoriteCharts(false);
      }
      this.loading = false;
      return this.checkAndRenderDialog();
    },
    async loadRegularCharts() {
      const query = this.$route.query;
      if (query?.page) {
        await this.loadParams(this.$route.query, false);
      } else {
        await this.loadItems();
      }
    }
  },
  async mounted() {
    if (this.isFavourite) {
      await this.loadFavorites();
    } else {
      return await this.loadRegularCharts();
    }
  },
  watch: {
    newChartExist() {
      if (!this.isFavourite) {
        this.$store.commit('explorer/curation/setNewChartExist', false);
        return this.loadItems();
      }
    },
    dialogBoxActive() {
      if (this.dialogBoxActive === false && this.isFavourite) {
        this.$store.commit('explorer/gallery/setMissingCharts', [], {
          root: true
        });
      }
    }
  },
  created() {
    this.$store.commit('setAppHeaderInfo', {
      icon: '',
      name: this.sender
    });
  }
};
</script>
