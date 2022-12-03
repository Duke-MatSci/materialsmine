<template>
	<div>
		<div>
      <CurateMenu active="Edit" :routes="routes"/>
      <div v-if="!verifyUser.isAuth">
          <LoginReq/>
      </div>

			<div v-else>
				<div>
          <div class="curate">
            <h2 class="visualize_header-h1">Select a dataset to edit</h2>
            <div class="md-layout md-alignment-bottom-left" style="margin-bottom:2rem">
                <div class="md-layout-item" style="align-items:end">
                    <span><b>User:</b> {{verifyUser.user.username}}</span>
                </div>
            </div>
          </div>
            <div class="section_loader u--margin-toplg" v-if="$apollo.loading">
              <spinner :loading="$apollo.loading" text='Loading Datasets'/>
            </div>

            <div v-else-if="getUserDataset.datasets">
              <div class="u_content__result u_margin-top-small">
                <span class="u_color utility-navfont" id="css-adjust-navfont">
                  <span v-if="getUserDataset.totalItems === 0">
                    No results
                  </span>
                  <span v-else-if="getUserDataset.totalItems === 1">
                    1 result
                  </span>
                  <span v-else>
                    About {{getUserDataset.totalItems}} results
                  </span>
                  <span class="utility-absolute-input ">
                    <label for="pagesize"> Page size: </label>
                      <select v-model="pageSize" name="pageSize" id="pageSize">
                        <option value="12">12</option>
                        <option value="24">24</option>
                        <option value="60">60</option>
                        <option value="120">120</option>
                      </select>
                  </span>
                </span>
              </div>
              <div class="grid_explorer-datasets curate-grid">
                <md-card
                  v-for="(dataset, index) in getUserDataset.datasets"
                  :key="index"
                  class="btn--animated"
                >
                    <md-card-header>
                      <md-card-header-text>
                          <router-link :to="{ name: 'DatasetSingleView', params: { id: dataset.datasetGroupId}}">
                            <div class="md-title"><a>Dataset ID: {{dataset.datasetGroupId}}</a></div>
                          </router-link>
                          <div class="md-subhead">
                            <!-- <div v-if="dataset.doi">DOI: {{dataset.doi}}</div>
                            <div>{{dataset.author[0] }} </div>
                            <div v-if="dataset.datasetComment">
                                {{dataset.datasetComment}}
                            </div> -->
                          </div>
                      </md-card-header-text>

                          <md-menu md-size="small" md-align-trigger>
                            <md-button class="md-icon-button" md-menu-trigger>
                              <md-icon>more_vert</md-icon>
                            </md-button>

                            <md-menu-content>
                              <md-menu-item>
                                <md-icon>edit</md-icon>
                                <span>Edit metadata</span>
                              </md-menu-item>

                              <md-menu-item>
                                <md-icon>add</md-icon>
                                <span>Add fileset</span>
                              </md-menu-item>

                              <md-menu-item>
                                <md-icon>file_open</md-icon>
                                <span>View</span>
                              </md-menu-item>
                            </md-menu-content>
                          </md-menu>
                    </md-card-header>
                    <md-card-content class="grid grid_col-3 curate-grid-icons">
                        <div v-for="(fileset, index) in dataset.filesetInfo" :key="index">
                          <router-link :to="{ name: 'FilesetSingleView', params: { id: dataset.datasetGroupId, filesetId: fileset.filesetName}}">
                            <md-button>
                                <md-icon class="md-size-3x" >folder</md-icon>
                                <div class="label">{{fileset.filesetName}}</div>
                            </md-button>
                          </router-link>
                        </div>
                    </md-card-content>
                </md-card>
              </div>
              <pagination
                :cpage="getUserDataset.pageNumber || getUserDataset.pageNumber"
                :tpages="getUserDataset.totalPages || getUserDataset.totalPages"
                @go-to-page="loadPrevNextImage($event)"
              />
            </div>

            <div v-else>
              No existing datasets for this user.
              <router-link :to="{ name: 'Curate' }">
                <a>Create a new dataset?</a>
              </router-link>
            </div>
        </div>
			</div>
		</div>
	</div>
</template>

<script>
import reducer from '@/mixins/reduce'
import Spinner from '@/components/Spinner'
import CurateMenu from '@/components/curate/CurateMenu.vue'
import pagination from '@/components/explorer/Pagination'
import { VERIFY_AUTH_QUERY, USER_DATASETS_QUERY } from '@/modules/gql/dataset-gql'
import LoginRequired from '@/components/LoginRequired.vue'
export default {
  name: 'CurateHome',
  mixins: [reducer],
  components: {
    LoginReq: LoginRequired,
    spinner: Spinner,
    CurateMenu,
    pagination
  },
  data () {
    return {
      loading: false,
      radio: false,
      verifyUser: {},
      getUserDataset: [],
      pageNumber: 1,
      pageSize: 12,
      routes: [
        {
          label: 'Curate',
          path: '/explorer/curate'
        },
        {
          label: 'Spreadsheet',
          path: '/explorer/curate/spreadsheet'
        }
      ]
    }
  },
  methods: {
    navBack () {
      this.$router.back()
    },
    loadPrevNextImage (event) {
      this.pageNumber = event
      this.$apollo.queries.verifyUser.skip = true
      this.$apollo.queries.getUserDataset.skip = false
      this.$apollo.queries.getUserDataset.refetch()
    },
  },
  apollo: {
    verifyUser: {
      query: VERIFY_AUTH_QUERY,
      fetchPolicy: 'cache-and-network'
    },
    getUserDataset: {
      query: USER_DATASETS_QUERY,
      variables () {
        return {
          input: { pageNumber: this.pageNumber, pageSize: parseInt(this.pageSize) }
        }
      },
      fetchPolicy: 'cache-and-network'
    }
  }
}
</script>
