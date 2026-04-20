<template>
  <div class="xmlLoader">
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
              {{ `${optionalChaining(() => controlID)}.yaml` }}
            </h2>
            <div class="u_centralize_text viz-u-mgbottom-sm">
              <a
                @click.prevent="openXml"
                class="viz-tab__button"
                :class="[!isActiveYamlView && 'active u--color-primary']"
                >XML View</a
              >
              ||
              <a
                class="viz-tab__button"
                :class="[isActiveYamlView && 'active u--color-primary']"
                href="#"
                >YAML View</a
              >
              ||
              <a
                @click.prevent="openHistory"
                class="viz-tab__button"
                :class="[!isActiveYamlView && 'active u--color-primary']"
                href="#"
                >History</a
              >
            </div>
          </div>
          <!-- xml viewer  -->
          <div class="wrapper" style="min-width: 90%" ref="codeBlock">
            <!-- <XmlView ref="codeBlock" :content="dataFeed" :isYaml="loadYaml" /> -->
            <pre>
              <code class="language-yml keepMarkUp">{{ optionalChaining(() => yamlString) }}</code>
            </pre>
          </div>
        </md-content>

        <md-content class="u_margin-bottom-small">
          <md-button
            class="md-primary md-raised btn--primary"
            :class="[
              isLargeTabView
                ? 'viz-u-display__show u--margin-centered'
                : 'viz-u-postion__abs utility-absolute-input visualize--link-bottom',
            ]"
            @click="
              requestApproval({
                curationId: xmlViewer.id,
                isNew: xmlViewer.isNewCuration,
              })
            "
            v-if="
              isAuth &&
              !isAdmin &&
              xmlViewer.status === 'Not Approved' &&
              xmlViewer.curationState === 'Editing'
            "
          >
            Request Approval
          </md-button>
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
      </div>
    </section>

    <section class="section_loader u--margin-toplg" v-else>
      <Spinner :loading="yamlLoading" text="Loading Yaml" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import Prism from 'prismjs';
import 'prismjs/themes/prism-coy.min.css';
import 'prismjs/themes/prism-dark.css';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-yaml';
import { useOptionalChaining } from '@/composables/useOptionalChaining';
import Comment from '@/components/explorer/Comment.vue';
import Spinner from '@/components/Spinner.vue';

// Component name for debugging
defineOptions({
  name: 'YamlVisualizer',
});

// Store and router
const store = useStore();
const router = useRouter();
const route = useRoute();

// Composables
const { optionalChaining } = useOptionalChaining();

// Template refs
const codeBlock = ref<HTMLElement>();

// Reactive data
const showSidepanel = ref(false);
const type = ref('xml');
const yamlString = ref('');
const yamlLoading = ref(false);
const xmlViewer = ref<any>({});

// Computed properties
const isAuth = computed(() => store.getters['auth/isAuthenticated']);
const isAdmin = computed(() => store.getters['auth/isAdmin']);

const isSmallTabView = computed(() => {
  return screen.width < 760;
});

const isLargeTabView = computed(() => {
  return screen.width < 1024;
});

const isActiveYamlView = computed(() => {
  return !!route.query.isYaml && !route.query.isHistory;
});

const xmlId = computed(() => {
  return Array.isArray(route.params.id) ? route.params.id[0] : route.params.id || '';
});

const controlID = computed(() => {
  const title = route.query?.title;
  const titleStr = Array.isArray(title) ? title[0] : title ?? '';
  return String(titleStr).split('.')[0];
});

// Methods
const navBack = () => {
  router.back();
};

const openAsYaml = async () => {
  yamlLoading.value = true;
  if (!controlID.value) {
    yamlLoading.value = false;
    return router.push({ name: 'XmlGallery' });
  }
  try {
    const res = await fetch(`/api/mn/yaml-loader/${controlID.value}`);
    if (!res.ok) {
      throw new Error('Failed to convert to YAML');
    }
    const yamlText = await res.text();
    yamlString.value = yamlText;
    yamlLoading.value = false;
  } catch (error: any) {
    yamlLoading.value = false;
    store.commit('setSnackbar', {
      message: error.message ?? 'An error occurred while trying to convert to YAML',
      action: () => openAsYaml(),
    });
  }
};

const openXml = () => {
  const query = {
    isNewCuration: route.query?.isNewCuration,
  };
  const params = {
    id: route.params.id,
  };

  return router.push({ name: 'XmlVisualizer', params, query });
};

const openHistory = () => {
  const query = {
    title: controlID.value,
    isNewCuration: route.query?.isNewCuration,
    isHistory: true,
  } as any;
  const params = {
    id: route.params.id,
  };

  return router.push({ name: 'SampleHistory', params, query });
};

const requestApproval = async ({ curationId, isNew }: { curationId: string; isNew: boolean }) => {
  await store.dispatch('explorer/curation/requestApproval', { curationId, isNew });
};

// Lifecycle
onMounted(async () => {
  await openAsYaml();
  window.Prism = window.Prism || {};
  window.Prism.manual = true;
});

// Watch for updates to highlight code
watch(
  () => yamlString.value,
  async () => {
    await nextTick();
    setTimeout(() => {
      if (codeBlock.value) {
        Prism.highlightAll();
      }
    }, 200);
  }
);
</script>
