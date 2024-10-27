<template>
  <div class="gallery">
    <div class="section_loader" v-if="loading">
      <spinner :loading="loading" text="Loading Datasets" />
    </div>
    <div class="utility-roverflow" v-else>
      <div class="utility-roverflow u--margin-toplg">
        <div class="search_box card-icon-container u--margin-toplg">
          <form class="form">
            <div class="search_box_form">
              <div class="form__group search_box_form-item-1">
                <input
                  type="text"
                  ref="search_input"
                  class="form__input form__input--flat"
                  placeholder="Search Datasets"
                  name="search"
                  id="search"
                  required
                  v-model.lazy="searchWord"
                />
                <label
                  htmlFor="search"
                  class="form__label search_box_form_label"
                  >Search Datasets</label
                >
              </div>
            </div>
            <div
              class="form__group search_box_form-item-2 explorer_page-nav u--margin-neg"
            >
              <!-- <div class="form__field md-field">
              <select class="form__select"
                v-model="filter" name="filter" id="filter">
                <option value="" disabled selected hidden>Filter by...</option>
                <option value="title">Title</option>
                <option value="keyword">Keyword</option>
                <option value="doi">DOI</option>
                <option value="organization">Organization</option>
                <option value="user">Curating User</option>
              </select>
            </div> -->
              <button
                type="submit"
                class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                @click.prevent="submitSearch()"
              >
                Search Datasets
              </button>
              <button
                v-if="searchEnabled"
                type="submit"
                class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                @click.prevent="customReset()"
              >
                Clear Search
              </button>
            </div>
          </form>
        </div>
      </div>
      <div class="u_content__result">
        <!-- TODO TIME TO RESULT -->
        <span class="u_color utility-navfont" id="css-adjust-navfont">
          <span v-if="total === 0"> No results </span>
          <span v-else-if="total === 1"> 1 result </span>
          <span v-else> About {{ total }} results </span>
        </span>
      </div>
      <template v-if="!!items && !!items.length">
        <div class="gallery-grid grid grid_col-5">
          <md-card
            v-for="(result, index) in items"
            :key="index"
            class="btn--animated gallery-item"
          >
            <div class="u_gridicon u_gridbg">
              <a download :href="optionalChaining(() => result.distribution)">
                <md-icon
                  class="u_color_white"
                  style="font-size: 14px !important"
                >
                  download</md-icon
                >
              </a>
              <div
                v-if="isAuth && isAdmin"
                @click.prevent="editDataset(result)"
              >
                <md-icon class="u_color_white">edit</md-icon>
              </div>
              <div
                v-if="isAuth && isAdmin"
                @click.prevent="
                  renderDialog('Delete Dataset?', 'delete', result, 80)
                "
              >
                <md-icon class="u_color_white">delete_outline</md-icon>
              </div>
            </div>
            <router-link
              v-if="result.identifier"
              :to="{
                name: 'DatasetVisualizer',
                params: { id: getDatasetId(result) }
              }"
            >
              <md-card-media-cover md-solid>
                <md-card-media v-if="result.thumbnail" md-ratio="4:3">
                  <img :src="result.thumbnail" :alt="result.label" />
                </md-card-media>
                <md-card-media v-else md-ratio="4:3" class="u--bg-grey">
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
          :cpage="pageNumber"
          :tpages="totalPages"
          @go-to-page="loadPrevNextImage($event)"
        />
      </template>
      <div
        class="utility-roverflow u_centralize_text u_margin-top-med"
        v-else-if="page > totalPages && totalPages > 0"
      >
        <h3 class="visualize_header-h3 u_margin-top-med">
          Invalid page number,
          <a @click.prevent="loadPrevNextImage(totalPages)"
            >return to page {{ totalPages }}?</a
          >
        </h3>
      </div>
      <div
        class="utility-roverflow u_centralize_text u_margin-top-med section_loader"
        v-else
      >
        <h1 class="visualize_header-h1 u_margin-top-med">No Datasets Found</h1>
      </div>
    </div>
    <dialogbox :active="dialogBoxActive" :minWidth="dialog.minWidth">
      <template v-slot:title>{{ dialog.title }}</template>
      <template v-slot:content>
        <div v-if="dialog.type == 'delete'">
          <md-content v-if="dialog.dataset">
            <div>
              This will permanently remove the dataset
              <b>{{ dialog.dataset.label }}</b>
            </div>
            with identifier <b>{{ dialog.dataset.identifier }}</b> and any
            associated files.
          </md-content>
        </div>
        <div v-if="dialogLoading">
          <spinner :loading="dialogLoading" text="Deleting Dataset" />
        </div>
      </template>
      <template v-slot:actions>
        <span v-if="dialog.type == 'delete' && dialog.dataset">
          <md-button @click.native.prevent="toggleDialogBox">
            No, cancel
          </md-button>
          <md-button @click.native.prevent="deleteDataset(dialog.dataset)">
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
import { mapGetters, mapMutations } from 'vuex';
import reducer from '@/mixins/reduce';
import optionalChainingUtil from '@/mixins/optional-chaining-util';
import explorerQueryParams from '@/mixins/explorerQueryParams';

export default {
  name: 'viz-grid',
  mixins: [reducer, explorerQueryParams, optionalChainingUtil],
  data() {
    return {
      loading: true,
      pageNumber: 1,
      baseUrl: `${window.location.origin}/api/files/`,
      dialog: {
        title: ''
      },
      dialogLoading: false,
      filter: '',
      searchWord: '',
      searchEnabled: false
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
      items: 'explorer/sddDatasets/getAllDatasets',
      page: 'explorer/sddDatasets/getPage',
      total: 'explorer/sddDatasets/getTotal',
      totalPages: 'explorer/sddDatasets/getTotalPages'
    })
  },
  methods: {
    ...mapMutations({ toggleDialogBox: 'setDialogBox' }),
    renderDialog(title, type, result, minWidth) {
      this.dialog = {
        title,
        type,
        minWidth,
        dataset: result
      };
      this.toggleDialogBox();
    },
    async submitSearch() {
      this.searchEnabled = !!this.searchWord; // || !!this.filtersActive
      this.pageNumber = 1;
      return await this.updateParamsAndCall(true);
    },
    async customReset(type) {
      this.filter = '';
      this.searchWord = null;
      await this.resetSearch(type);
    },
    async deleteDataset(dataset) {
      if (!this.isAdmin) return; // temporary safeguard
      this.dialogLoading = true;
      await this.$store.dispatch(
        'explorer/curation/deleteEntityNanopub',
        dataset.identifier
      );
      await this.$store.dispatch('explorer/curation/deleteEntityES', {
        identifier: dataset.identifier,
        type: 'datasets'
      });
      await this.$store.dispatch('explorer/curation/deleteEntityFiles', {
        distribution: dataset?.distribution ?? null,
        thumbnail: dataset?.thumbnail ?? null
      });
      this.toggleDialogBox();
      this.dialogLoading = false;
      await this.loadItems();
    },
    editDataset(dataset) {
      return this.$router.push(
        `/explorer/curate/sdd/edit/${this.getDatasetId(dataset)}`
      );
    },
    downloadFiles(item) {
      if (item.distribution) {
        fetch(item.distribution);
      }
    },
    async localSearchMethod() {
      if (this.searchEnabled) {
        this.$store.dispatch('explorer/sddDatasets/searchDatasetKeyword', {
          searchTerm: this.searchWord,
          page: this.pageNumber
        });
      } else await this.loadItems(this.pageNumber);
      this.loading = false;
    },
    async loadItems(page = 1) {
      this.loading = true;
      try {
        await this.$store.dispatch('explorer/sddDatasets/loadDatasets', {
          page
        });
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: error || 'Something went wrong',
          action: () => this.loadItems(page)
        });
      } finally {
        this.loading = false;
      }
    },
    getDatasetId(dataset) {
      return dataset.identifier.split('dataset/')[1];
    }
  },
  async mounted() {
    const query = this.$route.query;
    if (query) {
      await this.loadParams(this.$route.query, false);
    } else {
      await this.loadItems();
    }
  }
};
</script>
