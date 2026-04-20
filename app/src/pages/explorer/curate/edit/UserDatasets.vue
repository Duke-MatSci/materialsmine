<template>
  <div>
    <div>
      <CurateNavBar active="Edit" :navRoutes="navRoutes" />
      <div v-if="!verifyUser?.isAuth">
        <LoginReq />
      </div>
      <div v-else>
        <div>
          <div class="curate">
            <h2 class="visualize_header-h1">Select a dataset to edit</h2>
            <div class="md-layout md-alignment-bottom-left" style="margin-bottom: 2rem">
              <div class="md-layout-item" style="align-items: end">
                <span><b>User:</b> {{ verifyUser?.user?.username }}</span>
              </div>
            </div>
          </div>
          <div class="section_loader u--margin-toplg" v-if="loading">
            <spinner :loading="loading" text="Loading Datasets" />
          </div>

          <div v-else-if="getUserDataset?.datasets">
            <div class="u_content__result u_margin-top-small">
              <span class="u_color utility-navfont" id="css-adjust-navfont">
                <span v-if="getUserDataset.totalItems === 0"> No results </span>
                <span v-else-if="getUserDataset.totalItems === 1"> 1 result </span>
                <span v-else> About {{ getUserDataset.totalItems }} results </span>
                <span class="utility-absolute-input">
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
                    <router-link
                      :to="{ name: 'DatasetSingleView', params: { id: dataset.datasetGroupId } }"
                    >
                      <div class="md-title">
                        <a>Dataset ID: {{ dataset.datasetGroupId }}</a>
                      </div>
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
                  <div v-for="(fileset, filesetIndex) in dataset.filesetInfo" :key="filesetIndex">
                    <router-link
                      :to="{
                        name: 'FilesetSingleView',
                        params: { id: dataset.datasetGroupId, filesetId: fileset.filesetName },
                      }"
                    >
                      <md-button>
                        <md-icon class="md-size-3x">folder</md-icon>
                        <div class="label">{{ fileset.filesetName }}</div>
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

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import Spinner from '@/components/Spinner.vue';
import CurateNavBar from '@/components/curate/CurateNavBar.vue';
import Pagination from '@/components/explorer/Pagination.vue';
import LoginRequired from '@/components/LoginRequired.vue';
import { VERIFY_AUTH_QUERY, USER_DATASETS_QUERY } from '@/modules/gql/dataset-gql';

// Component name for debugging
defineOptions({
  name: 'UserDatasets',
});

// Interfaces
interface NavRoute {
  label: string;
  path: string;
}

interface User {
  username: string;
}

interface VerifyUserData {
  isAuth: boolean;
  user: User;
}

interface Fileset {
  filesetName: string;
}

interface Dataset {
  datasetGroupId: string;
  doi?: string;
  author?: string[];
  datasetComment?: string;
  filesetInfo: Fileset[];
}

interface UserDatasetData {
  datasets: Dataset[];
  pageNumber: number;
  totalPages: number;
  totalItems: number;
}

// Reactive data
const pageNumber = ref(1);
const pageSize = ref<string | number>('12');

const navRoutes = ref<NavRoute[]>([
  {
    label: 'Curate',
    path: '/explorer/curate',
  },
  {
    label: 'Spreadsheet',
    path: '/explorer/curate/spreadsheet',
  },
]);

// GraphQL queries
const { result: verifyUserResult } = useQuery<{ verifyUser: VerifyUserData }>(
  VERIFY_AUTH_QUERY,
  {},
  {
    fetchPolicy: 'cache-and-network',
  }
);

const {
  result: userDatasetResult,
  loading,
  refetch: refetchUserDataset,
} = useQuery<{ getUserDataset: UserDatasetData }>(
  USER_DATASETS_QUERY,
  () => ({
    input: {
      pageNumber: pageNumber.value,
      pageSize: parseInt(pageSize.value as string),
    },
  }),
  {
    fetchPolicy: 'cache-and-network',
  }
);

// Computed
const verifyUser = computed(() => verifyUserResult.value?.verifyUser);
const getUserDataset = computed(() => userDatasetResult.value?.getUserDataset);

// Methods
const loadPrevNextImage = (event: number) => {
  pageNumber.value = event;
  refetchUserDataset();
};

// Watch for pageSize changes to refetch data
watch(pageSize, () => {
  pageNumber.value = 1; // Reset to first page when page size changes
  refetchUserDataset();
});
</script>
