<template>
	<div>
		<div class="section_teams">
            <div class="section_loader u--margin-toplg" v-if="$apollo.loading">
              <spinner :loading="$apollo.loading" text='Loading Dataset Info'/>
            </div>
            <div
                v-else
            >
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
                  <router-link to="/explorer/curate/edit" v-slot="{navigate, href}" custom>
                    <a :href="href" @click="navigate">
                      <md-tooltip md-direction="bottom">
                      Select Dataset
                      </md-tooltip>
                      Select Dataset
                    </a>
                  </router-link>
                  <span class="md-icon-button"> > </span>
                  <span
                      class="md-icon-button"
                  >
                      Dataset {{$route.params.id}}
                  </span>
                </div>
            </div>

            <div v-if="!verifyUser.isAuth">
                <LoginReq/>
            </div>
			<div v-else class="curate">
				<div>
                <!-- <h2 class="visualize_header-h1">Dataset </h2> -->

                <div class="utility-roverflow">
                    <!-- <md-toolbar>
                      <h3 class="md-title" style="flex: 1">Dataset {{datasetId}}</h3>
                      <md-button class="md-icon-button">
                        <md-icon>more_vert</md-icon>
                      </md-button>
                    </md-toolbar> -->
                    <div class="grid_explorer-datasets">
                        <md-card
                        v-for="(fileset, index) in getFilesets.filesets"
                        :key="index"
                        class="btn--animated gallery-item"
                        style="margin:1rem;padding-bottom:2rem"
                        >
                        <md-card-header>
                          <router-link :to="{ name: 'FilesetSingleView', params: { filesetId: fileset.filesetName}}">
                            <div class="md-title" style="font-size:18px"><a>{{fileset.filesetName}}</a></div>
                          </router-link>
                        </md-card-header>
                        <md-card-content class="grid_explorer-datasets grid_explorer-datasets-icons">
                            <div v-for="(file, index) in fileset.files" :key="index"  >
                              <router-link :to="{ name: 'FileSingleView', params: { filesetId: fileset.filesetName, file: file.filename}}">
                                <md-button  style="height:10rem;max-width:8rem!important" md-label="test">
                                    <md-icon class="md-size-3x" >insert_drive_file</md-icon>
                                <div style="font-size:9px; color:black">{{file.filename}}</div>
                                </md-button>
                                <md-tooltip>{{file.filename}}</md-tooltip>
                              </router-link>
                            </div>
                        </md-card-content>
                        </md-card>
                    </div>
                </div>

                </div>
			</div>
		</div>
	</div>
</template>

<script>
import reducer from '@/mixins/reduce'
import Spinner from '@/components/Spinner'
import { VERIFY_AUTH_QUERY, FILESET_QUERY } from '@/modules/gql/dataset-gql'
import LoginRequired from '@/components/LoginRequired.vue'
export default {
  name: 'CurateHome',
  mixins: [reducer],
  components: {
    LoginReq: LoginRequired,
    Spinner
  },
  props: {
    id: {
      type: String
    }
  },
  data () {
    return {
      radio: false,
      verifyUser: {},
      getFilesets: {}
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
    getFilesets: {
      query: FILESET_QUERY,
      variables () {
        return {
          input: { datasetId: `${this.id}` }
        }
      },
      fetchPolicy: 'cache-and-network'
    }
  }
}
</script>
