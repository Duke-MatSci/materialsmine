<template>
  <div class="xmlLoader">
    <Dialog :minWidth="40" :active="dialogBoxActive">
      <template #title>{{ dialogTitle }}</template>
      <template #content>
        <div class="u_display-flex u_centralize_items u--margin-posmd">
          <md-icon class="u--font-emph-smm u--margin-pos" style="color: green"
            >check_circle</md-icon
          >
          <span>{{ dialogMessage }}</span>
        </div>
      </template>
      <template #actions>
        <md-button v-if="dialogMode === 'edit'" @click="confirmEditCuration">Submit</md-button>
        <md-button v-else-if="approvalInProgress" @click="approval"
          >Submit</md-button
        >
        <md-button @click.prevent="closeDialogBox">Close</md-button>
      </template>
    </Dialog>
    <section
      class="u_width--max viz-u-postion__rel utility-roverflow"
      v-if="!!Object.keys(xmlViewer).length && xmlViewer.xmlString"
    >
      <md-drawer
        class="md-right"
        :class="{ ' md-fixed': showSidepanel }"
        v-model:md-active="showSidepanel"
      >
        <Comment :type="type" :identifier="optionalChaining(() => xmlViewer.id)"></Comment>
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
              {{ optionalChaining(() => xmlViewer.title) }}
            </h2>
            <div class="u_centralize_text viz-u-mgbottom-sm">
              <a
                href="#"
                class="viz-tab__button"
                :class="[isActiveXmlView && 'active u--color-primary']"
                >XML View</a
              >
              ||
              <a
                class="viz-tab__button"
                :class="[!isActiveXmlView && 'active u--color-primary']"
                @click.prevent="openYaml"
                >YAML View</a
              >
              ||
              <a
                class="viz-tab__button"
                :class="[!isActiveXmlView && 'active u--color-primary']"
                @click.prevent="openHistory"
                >History</a
              >
            </div>
          </div>
          <!-- xml viewer  -->
          <div class="wrapper" style="min-width: 90%">
            <pre>
              <code class="language-xml" ref="codeBlock">{{ optionalChaining(() => xmlViewer.xmlString) }}</code>
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
            {{ !isAdmin ? 'Request Approval' : 'Submit' }}
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

        <md-button
          @click.prevent="openEditDialog"
          v-if="isAuth && (xmlViewer.user === userId || isAdmin)"
          class="md-fab md-dense md-primary btn--primary"
        >
          <md-tooltip md-direction="top">Edit Curation</md-tooltip>
          <md-icon>edit</md-icon>
        </md-button>

        <md-button
          @click="approveCuration"
          v-if="isAuth && isAdmin && xmlViewer.curationState !== 'Completed'"
          class="md-fab md-dense md-primary btn--primary"
        >
          <md-tooltip md-direction="top">Approve</md-tooltip>
          <md-icon>check</md-icon>
        </md-button>
      </div>
    </section>

    <section class="section_loader u--margin-toplg" v-else-if="loading">
      <Spinner :loading="loading" text="Loading Xml" />
    </section>
    <section class="section_loader u--margin-toplg" v-else>
      <h2 class="visualize_header-h1 u_margin-top-med u_centralize_text">
        This XML no longer exists or has been moved
      </h2>
      <div class="u_margin-top-small u_centralize_text">
        <a @click.prevent="navBack" class="btn btn--primary btn--noradius u_color_white">Go Back</a>
      </div>
      <!-- <button
        type="submit"
        class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
        @click.prevent="submitSearch"
      >
        Search Xml
      </button> -->
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import Prism from 'prismjs';
import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-coy.min.css';
import { useOptionalChaining } from '@/composables/useOptionalChaining';
import { useXmlViewer } from '@/composables/useXmlViewer';
import Comment from '@/components/explorer/Comment.vue';
import Spinner from '@/components/Spinner.vue';
import Dialog from '@/components/Dialog.vue';

// Component name for debugging
defineOptions({
  name: 'XmlVisualizer',
});

// Store and router
const store = useStore();
const router = useRouter();
const route = useRoute();

// Composables
const { optionalChaining } = useOptionalChaining();
const {
  xmlViewer,
  loading,
  isAuth,
  isAdmin,
  dialogBoxActive,
  closeDialogBox: baseCloseDialogBox,
  approveCuration: baseApproveCuration,
  approval: baseApproval,
} = useXmlViewer();

// Template refs
const codeBlock = ref<HTMLElement>();

// Reactive data
const showSidepanel = ref(false);
const type = ref('xml');
const approvalInProgress = ref(false);
const dialogMode = ref<'approval' | 'edit'>('approval');

// Computed properties
const userId = computed(() => store.getters['auth/userId']);
const dialogTitle = computed(() => {
  if (dialogMode.value === 'edit') {
    return `Edit ${xmlViewer.value.id} Sample`;
  }
  return approvalInProgress.value ? 'Confirmation' : 'Success';
});
const dialogMessage = computed(() => {
  if (dialogMode.value === 'edit') {
    return `Please confirm your action to edit ${xmlViewer.value.id} xml sample`;
  }
  return approvalInProgress.value
    ? 'Please confirm your submission'
    : 'XML has been approved and successfully ingested into the knowledge graph';
});

const isSmallTabView = computed(() => {
  return screen.width < 760;
});

const isLargeTabView = computed(() => {
  return screen.width < 1024;
});

const isActiveXmlView = computed(() => !route.query.isYaml && !route.query.isHistory);

// Methods
const closeDialogBox = () => {
  baseCloseDialogBox();
  dialogMode.value = 'approval';
};

const navBack = () => {
  router.back();
};

const editCuration = (id: string, isNew: boolean) => {
  if (!!id && typeof isNew === 'boolean') {
    return router.push({
      name: 'EditXmlCuration',
      query: { isNew: String(isNew), id: id },
    });
  }
};

const openEditDialog = () => {
  dialogMode.value = 'edit';
  approvalInProgress.value = false;
  store.commit('setDialogBox', true, { root: true });
};

const confirmEditCuration = () => {
  closeDialogBox();
  editCuration(xmlViewer.value.id, xmlViewer.value.isNewCuration);
};

const openYaml = () => {
  const query = {
    title: xmlViewer.value.title?.split('.')[0],
    isNewCuration: route.query?.isNewCuration,
    isYaml: true,
  } as any;
  const params = {
    id: route.params.id,
  };

  return router.push({ name: 'YamlVisualizer', params, query });
};

const openHistory = () => {
  const query = {
    title: xmlViewer.value.title?.split('.')[0],
    isNewCuration: route.query?.isNewCuration,
    isHistory: true,
  } as any;
  const params = {
    id: route.params.id,
  };

  return router.push({ name: 'SampleHistory', params, query });
};

const approval = async () => {
  closeDialogBox();
  approvalInProgress.value = false;
  await baseApproval();
};

const approveCuration = () => {
  dialogMode.value = 'approval';
  approvalInProgress.value = true;
  baseApproveCuration();
};

const requestApproval = async ({ curationId, isNew }: { curationId: string; isNew: boolean }) => {
  if (isAdmin.value) {
    approveCuration();
  } else return await store.dispatch('explorer/curation/requestApproval', { curationId, isNew });
};

// Lifecycle
onMounted(() => {
  window.Prism = window.Prism || {};
  window.Prism.manual = true;
});

// Watch for updates to highlight code
watch(
  () => xmlViewer.value.xmlString,
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
