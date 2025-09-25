<template>
  <div>
    <div>
      <div v-if="!verifyUser.isAuth">
        <LoginReq />
      </div>
      <div v-else>
        <CurateNavBar :active="'Dataset ' + id" :navRoutes="navRoutes" />

        <div class="section_loader u--margin-toplg" v-if="loading">
          <Spinner :loading="loading" text="Loading Dataset Info" />
        </div>

        <div v-else>
          <div class="curate">
            <div class="md-layout md-gutter md-alignment-left-bottom" style="margin: 1rem 0rem">
              <div
                class="md-layout-item md-size-70 md-medium-size-100"
                style="display: block; height: 100%"
              >
                <h2 class="visualize_header-h2">Dataset Group ID: {{ id }}</h2>
              </div>
              <div class="md-layout-item md-size-15 curate-actions_lg">
                <md-button class="md-button-lightbg" @click="goToEdit"
                  >+ Create new fileset
                </md-button>
              </div>
              <div class="md-layout-item md-size-15 curate-actions_lg">
                <md-button class="md-button-lightbg">+ Edit metadata </md-button>
              </div>
            </div>
            <hr />
            <div class="curate-actions_sm">
              <md-button class="md-button-lightbg" @click="goToEdit"
                >+ Create new fileset
              </md-button>
              <md-button class="md-button-lightbg">+ Edit metadata </md-button>
            </div>
            <h2 style="margin-top: 2rem; margin-bottom: 2rem">Metadata</h2>
            <h2 style="margin-top: 2rem; margin-bottom: 2rem">Filesets</h2>
          </div>
          <div class="utility-roverflow">
            <div class="grid_explorer-datasets curate-grid">
              <md-card
                v-for="(fileset, index) in getFilesets.filesets"
                :key="index"
                class="btn--animated"
              >
                <md-card-header>
                  <router-link
                    :to="{
                      name: 'FilesetSingleView',
                      params: { filesetId: fileset.filesetName },
                    }"
                  >
                    <div class="md-title">
                      <a>{{ fileset.filesetName }}</a>
                    </div>
                  </router-link>
                </md-card-header>
                <md-card-content class="grid grid_col-3 curate-grid-icons">
                  <div v-for="(file, index) in fileset.files" :key="index">
                    <router-link
                      :to="{
                        name: 'FileSingleView',
                        params: {
                          filesetId: fileset.filesetName,
                          file: file.filename,
                        },
                      }"
                    >
                      <md-button>
                        <md-icon class="md-size-3x">insert_drive_file</md-icon>
                        <div class="label">{{ file.filename }}</div>
                      </md-button>
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

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import { VERIFY_AUTH_QUERY, FILESET_QUERY } from '@/modules/gql/dataset-gql';
import Spinner from '@/components/Spinner.vue';
import CurateNavBar from '@/components/curate/CurateNavBar.vue';
import LoginRequired from '@/components/LoginRequired.vue';

// Component name for debugging
defineOptions({
  name: 'CurateHome',
});

// Props
interface Props {
  id: string;
}

const props = defineProps<Props>();

// Router
const router = useRouter();

// Reactive data
const radio = ref(false);
const verifyUser = ref<any>({});
const getFilesets = ref<any>({});
const navRoutes = ref([
  {
    label: 'Curate',
    path: '/explorer/curate',
  },
  {
    label: 'Select Dataset',
    path: '/explorer/curate/edit',
  },
]);

// GraphQL queries
const { result: verifyUserResult, loading: verifyUserLoading } = useQuery(
  VERIFY_AUTH_QUERY,
  () => ({}),
  () => ({
    fetchPolicy: 'cache-and-network',
  })
);

const { result: getFilesetsResult, loading: getFilesetsLoading } = useQuery(
  FILESET_QUERY,
  () => ({
    input: { datasetId: `${props.id}` },
  }),
  () => ({
    fetchPolicy: 'cache-and-network',
  })
);

// Watch for query results
watch(verifyUserResult, (newResult) => {
  if (newResult?.verifyUser) {
    verifyUser.value = newResult.verifyUser;
  }
});

watch(getFilesetsResult, (newResult) => {
  if (newResult?.getFilesets) {
    getFilesets.value = newResult.getFilesets;
  }
});

// Computed properties
const loading = computed(() => verifyUserLoading.value || getFilesetsLoading.value);

// Methods
const navBack = () => {
  router.back();
};

const goToEdit = () => {
  router.push({ name: 'CurateSpreadsheet', params: { datasetId: props.id } });
};
</script>
