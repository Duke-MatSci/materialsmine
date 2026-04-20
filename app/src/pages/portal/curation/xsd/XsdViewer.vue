<template>
  <div class="xmlLoader">
    <md-app-content class="u_width--max viz-u-postion__rel utility-roverflow">
      <md-content
        class="u_width--max md-app-side-drawer md-app-container md-scrollbar"
      >
        <div :class="[isSmallTabView ? 'u_margin-top-med' : '']">
          <h2 class="visualize_header-h1 u_margin-top-med u_centralize_text">
            XSD view
          </h2>
        </div>
        <!-- xsd viewer  -->
        <div class="wrapper">
          <section class="section_loader" v-if="!xsd">
            <spinner text="Loading Json Schema" />
          </section>
          <pre v-else class="language-xml grid">
          <code class="inlinecode language-xml keepMarkUp">
            {{ xsd }}
          </code>
        </pre>
        </div>
      </md-content>
      <div
        :class="[
          isSmallTabView
            ? 'u_margin-top-small u_adjust-banner-text'
            : 'u--margin-neg',
          'md-fab md-fab-top-right u_width--max u--shadow-none u--layout-flex u--layout-flex-justify-end u--b-rad'
        ]"
      >
        <md-button
          class="md-fab md-dense md-primary btn--primary"
          @click.prevent="navBack"
        >
          <md-tooltip> Go Back </md-tooltip>
          <md-icon>arrow_back</md-icon>
        </md-button>

        <md-button
          @click="downloadJsonSchemaHandler"
          v-if="isAuth && isAdmin"
          class="md-fab md-dense md-primary btn--primary"
        >
          <md-tooltip md-direction="top">Download schema</md-tooltip>
          <md-icon>download</md-icon>
        </md-button>
      </div>
    </md-app-content>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import spinner from '@/components/Spinner.vue';
import Prism from 'prismjs';
import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-coy.min.css';

defineOptions({
  name: 'XsdView',
  components: {
    spinner
  }
});

const store = useStore();
const router = useRouter();

// Computed properties from store
const token = computed(() => store.getters['auth/token']);
const isAdmin = computed(() => store.getters['auth/isAdmin']);
const isAuth = computed(() => store.getters['auth/isAuthenticated']);
const xsd = computed(() => store.getters['portal/xsd']);

const isSmallTabView = computed(() => {
  return screen.width < 760;
});

// Methods
const downloadJsonSchemaHandler = () => {
  store.dispatch('portal/downloadJsonSchema');
};

const fetchJsonSchemaHandler = () => {
  store.dispatch('portal/fetchJsonSchema');
};

const navBack = () => {
  router.back();
};

// Lifecycle hooks
onMounted(() => {
  window.Prism = window.Prism || {};
  window.Prism.manual = true;
  Prism.highlightAll();
  fetchJsonSchemaHandler();

  // Set app header info
  store.commit('setAppHeaderInfo', { icon: '', name: 'XSD Schema' });
});
</script>
