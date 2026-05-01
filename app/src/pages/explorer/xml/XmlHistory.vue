<template>
  <div class="xmlLoader">
    <Dialog :minWidth="40" :active="dialogBoxActive">
      <template #title>{{ approvalInProgress ? 'Confirmation' : 'Success' }}</template>
      <template #content>
        <div class="u_display-flex u_centralize_items u--margin-posmd">
          <md-icon class="u--font-emph-smm u--margin-pos" style="color: green"
            >check_circle</md-icon
          >
          <span>{{
            approvalInProgress
              ? 'Please confirm your submission'
              : 'XML has been approved and successfully ingested into the knowledge graph'
          }}</span>
        </div>
      </template>
      <template #actions>
        <md-button v-if="approvalInProgress" @click="submitApproval">Submit</md-button>
        <md-button @click.prevent="closeDialogBox">Close</md-button>
      </template>
    </Dialog>
    <section class="u_width--max viz-u-postion__rel utility-roverflow" v-if="!yamlLoading">
      <md-drawer
        class="md-right"
        :class="{ ' md-fixed': showSidepanel }"
        v-model:mdActive="showSidepanel"
      >
        <Comment :type="type" :identifier="xmlId"></Comment>
        <md-button
          @click="showSidepanel = false"
          class="md-fab md-fixed md-dense md-fab-top-right md-primary btn--primary"
        >
          <md-icon>close</md-icon>
        </md-button>
      </md-drawer>

      <div class="u_width--max viz-u-postion__rel utility-roverflow">
        <md-content
          class="u_width--max md-app-side-drawer md-app-container md-scrollbar u_margin-none"
        >
          <div :class="[isSmallTabView ? 'u_myprofile--container' : '']">
            <h2 class="visualize_header-h1 u_margin-top-med u_centralize_text">
              Document Revision History
            </h2>
            <div class="u_centralize_text viz-u-mgbottom-sm">
              <a
                @click.prevent="openXml"
                class="viz-tab__button"
                :class="[!isActiveHistoryView && 'active u--color-primary']"
                >XML View</a
              >
              ||
              <a
                @click.prevent="openYaml"
                class="viz-tab__button"
                :class="[!isActiveHistoryView && 'active u--color-primary']"
                >YAML View</a
              >
              ||
              <a
                class="viz-tab__button"
                :class="[isActiveHistoryView && 'active u--color-primary']"
                href="#"
                >History</a
              >
            </div>
          </div>
          <!-- xml viewer  -->
          <div class="wrapper u_margin-top-med" style="min-width: 90%">
            <!-- <XmlView ref="codeBlock" :content="dataFeed" :isYaml="loadYaml" /> -->
            <!-- <pre>
              <code class="language-yml keepMarkUp">{{ optionalChaining(() => yamlString) }}</code>
            </pre> -->
            <TableComponent :emptyState="emptyState" :tableData="changeLogs" sortBy="Version" />
          </div>
        </md-content>
      </div>
      <div
        :class="[
          isSmallTabView ? 'u_margin-top-small u_adjust-banner-text' : 'u--margin-neg',
          'md-fab md-fab-top-right u_width--max u--shadow-none u--layout-flex u--layout-flex-justify-end u--b-rad',
        ]"
      >
        <md-button class="md-fab md-dense md-primary btn--primary" @click.prevent="navBack">
          <md-tooltip>Go Back</md-tooltip>
          <md-icon>arrow_back</md-icon>
        </md-button>

        <md-button @click="showSidepanel = true" class="md-fab md-dense md-primary btn--primary">
          <md-tooltip md-direction="top">Comment</md-tooltip>
          <md-icon>comment</md-icon>
        </md-button>

        <md-button
          @click="handleApproveCuration"
          v-if="
            isAuth && xmlViewer.status === 'Approved' && xmlViewer.curationState === 'Completed'
          "
          class="md-fab md-dense md-primary btn--primary"
        >
          <md-tooltip md-direction="top">Resubmit XML</md-tooltip>
          <md-icon>check</md-icon>
        </md-button>
      </div>
    </section>

    <section class="section_loader u--margin-toplg" v-else>
      <Spinner :loading="yamlLoading" text="Loading Yaml" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useXmlViewer } from '@/composables/useXmlViewer';
import Comment from '@/components/explorer/Comment.vue';
import Dialog from '@/components/Dialog.vue';
import Spinner from '@/components/Spinner.vue';
import TableComponent from '@/components/explorer/TableComponent.vue';

// Component name for debugging
defineOptions({
  name: 'SampleHistory',
});

// Store and router
const store = useStore();
const router = useRouter();
const route = useRoute();

// Composable
const { xmlViewer, isAuth, dialogBoxActive, approveCuration, approval, closeDialogBox } =
  useXmlViewer();

// Reactive data
const showSidepanel = ref(false);
const type = ref('xml');
const yamlLoading = ref(false);
const approvalInProgress = ref(false);
const isSmallTabView = computed(() => {
  return screen.width < 760;
});

const isActiveHistoryView = computed(() => !route.query.isYaml && !!route.query.isHistory);

const xmlId = computed(() => {
  return Array.isArray(route.params.id) ? route.params.id[0] : route.params.id || '';
});

// retrieve getChangeLogs getter
const changeLogs = computed(() => store.getters['explorer/curation/getChangeLogs']);

// TODO: Refactor as this is a repetition of code in YamlLoader.vue
const controlID = computed(() => {
  const title = route.query?.title;
  const titleStr = Array.isArray(title) ? title[0] : title ?? '';
  return String(titleStr).split('.')[0];
});

const emptyState = computed(() => `No History Data Found for ${controlID.value}`);

// Methods
const handleApproveCuration = () => {
  approvalInProgress.value = true;
  approveCuration();
};

const submitApproval = async () => {
  closeDialogBox();
  approvalInProgress.value = false;
  await approval();
  store.dispatch('explorer/curation/fetchChangeLogs', xmlId.value);
};

const navBack = () => {
  router.back();
};

const openYaml = () => {
  const query = {
    title: controlID.value,
    isNewCuration: route.query?.isNewCuration,
    isYaml: true,
  } as any;
  const params = {
    id: route.params.id,
  };

  return router.push({ name: 'YamlVisualizer', params, query });
};

// TODO: Refactor as this is a repetition of code in YamlLoader.vue
const openXml = () => {
  const query = {
    isNewCuration: route.query?.isNewCuration,
  } as any;
  1;
  const params = {
    id: route.params.id,
  };

  return router.push({ name: 'XmlVisualizer', params, query });
};

onMounted(() => {
  store.dispatch('explorer/curation/fetchChangeLogs', xmlId.value);
});
</script>
