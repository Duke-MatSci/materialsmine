<template>
	<div>
		<div class="section_teams">
      <div>
          <div>
              <md-button
                  class="md-icon-button"
                  @click.native.prevent="navBack"
              >
                  <md-tooltip md-direction="bottom">
                  Go Back
                  </md-tooltip>
              <md-icon>arrow_back</md-icon>
              </md-button>
              <router-link to="/explorer/curate" v-slot="{navigate, href}" custom>
                <a :href="href" @click="navigate">
                  <md-tooltip md-direction="bottom">
                  Curate Home
                  </md-tooltip>
                  Curate
                </a>
              </router-link>
              <span class="md-icon-button"> > </span>
              <span
                  class="md-icon-button"
              >
                  Edit
              </span>
          </div>
      </div>
      <div v-if="!verifyUser.isAuth">
          <LoginReq/>
      </div>

			<div v-else class="curate">
				<div>
            <h2 class="visualize_header-h1">Select a dataset to edit</h2>
            <div class="md-layout md-alignment-bottom-left" style="margin-bottom:2rem">
                <div class="md-layout-item" style="align-items:end">
                    <span><b>User:</b> {{verifyUser.user.username}}</span>
                </div>
            </div>
            <div class="section_loader u--margin-toplg" v-if="$apollo.loading">
              <spinner :loading="$apollo.loading" text='Loading Datasets'/>
            </div>

            <div v-else-if="getUserDataset.datasets">
              <div class="grid_explorer-datasets">
                <md-card
                  v-for="(dataset, index) in getUserDataset.datasets.userDatasetInfo"
                  :key="index"
                  class="btn--animated gallery-item"
                >
                    <md-card-header>
                      <md-card-header-text>
                          <router-link :to="{ name: 'DatasetSingleView', params: { id: dataset.datasetId}}">
                            <div class="md-title" style="font-size:18px"><a>Dataset ID: {{dataset.datasetId}}</a></div>
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
                    <md-card-content class="grid_explorer-datasets grid_explorer-datasets-icons">
                        <div v-for="(fileset, index) in dataset.datasets" :key="index">
                          <router-link :to="{ name: 'FilesetSingleView', params: { id: dataset.datasetId, filesetId: fileset.filesetName}}">
                            <md-button style="height:10rem;max-width:10rem!important" md-label="test">
                                <md-icon class="md-size-3x" >folder</md-icon>
                                <div style="font-size:9px; color:black">{{fileset.filesetName}}</div>
                            </md-button>
                            <!-- <md-tooltip>{{fileset.filesetName}}</md-tooltip> -->
                          </router-link>
                        </div>
                    </md-card-content>
                </md-card>
              </div>
            </div>

            <div v-else>
              No existing datasets for this user.
              <router-link :to="{ name: 'CurateMethod' }">
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
import { VERIFY_AUTH_QUERY, USER_DATASETS_QUERY } from '@/modules/gql/dataset-gql'
import LoginRequired from '@/components/LoginRequired.vue'
export default {
  name: 'CurateHome',
  mixins: [reducer],
  components: {
    LoginReq: LoginRequired,
    spinner: Spinner
  },
  data () {
    return {
      loading: false,
      radio: false,
      verifyUser: {},
      getUserDataset: []
    }
  },
  methods: {
    navBack () {
      this.$router.back()
    }
  },
  apollo: {
    verifyUser: {
      query: VERIFY_AUTH_QUERY,
      fetchPolicy: 'cache-and-network'
    },
    getUserDataset: {
      query: USER_DATASETS_QUERY,
      // skip () {
      //   if (!this.verifyUser.isAuth) return this.skipQuery
      // },
      fetchPolicy: 'cache-and-network'
    }
  }
}
</script>
