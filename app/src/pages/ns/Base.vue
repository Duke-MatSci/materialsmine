<template>
  <md-app md-waterfall md-mode="fixed">
    <md-app-toolbar :showTop="showTop" :toggler="toggleMenu" />
    <md-app-drawer :md-active.sync="toggleMenuVisibility">
      <drawers />
    </md-app-drawer>
    <md-app-content
      v-if="!loading"
      class="u--padding-zero u--layout-flex u--layout-flex-column utility-roverflow"
    >
      <div class="section_loader" v-if="loading">
        <spinner :loading="loading" text="Loading Ontology Data" />
      </div>
      <template v-else>
        <router-view v-if="!namespace" />

        <template v-else>
          <component v-if="!searchLoading" :is="resolvedComponent"></component>
        </template>

        <div class="explorer_page_footer u_margin-top-auto">
          <span class="explorer_page_footer-text">
            &copy; {{ new Date().getFullYear() }} MaterialsMine Project
          </span>
        </div>
      </template>
    </md-app-content>
  </md-app>
</template>
<script>
import Drawers from '@/components/Drawer.vue';
import ExpHeader from '@/components/explorer/Header.vue';
import spinner from '@/components/Spinner';

export default {
  name: 'NameSpaceBase',
  components: {
    mdAppToolbar: ExpHeader,
    Drawers,
    spinner

    // Classes
  },
  data() {
    return {
      toggleMenuVisibility: false,
      showTop: true,
      searchLoading: true,
      componentToRender: ''
    };
  },
  computed: {
    loading() {
      return this.$store.getters['ns/isLoading'];
    },
    searchResult() {
      return this.$store.state.ns.currentClass;
    },
    namespace() {
      return this.$route.params?.namespace;
    },
    getBody() {
      return document.querySelector('.md-app.md-fixed .md-app-scroller');
    },
    resolvedComponent() {
      /* eslint-disable */
      if (!this.namespace) return null;

      const result = this.searchResult ? 'Classes' : 'Home';
      if (!result) {
        return null;
      }
      return () =>
        import(`@/pages/ns/${result}.vue`).then((module) => {
          return module.default;
        });
    }
  },
  async created() {
    await this.$store.dispatch('ns/fetchNsData');
    if (this.namespace) await this.findQuery(this.namespace);
  },
  mounted() {
    this.$nextTick(() => {
      this.getBody.addEventListener('scroll', this.adjustHeader);
    });
  },
  beforeDestroy() {
    this.getBody.removeEventListener('scroll', this.adjustHeader);
  },
  methods: {
    toggleMenu() {
      this.toggleMenuVisibility = !this.toggleMenuVisibility;
    },
    adjustHeader() {
      const scrollHeight = this.getBody.scrollTop;
      if (window.innerWidth < 650) return;
      this.showTop = !(scrollHeight > 100);
      const offset = scrollHeight > 100 ? '-74px' : '0px';
      this.getBody.style.position = 'relative';
      this.getBody.style.marginTop = offset;
      this.getBody.style.paddingBottom = offset;
    },
    async findQuery(query) {
      this.searchLoading = true;
      this.$store.commit('ns/clearCurrentClass');
      await this.$nextTick();
      this.$store.dispatch('ns/searchNSData', { query, singleResult: true });
      if (this.searchResult) {
        this.$store.commit('ns/setSelectedId', this.searchResult.ID);
      }
      this.searchLoading = false;
    }
  },
  watch: {
    '$route.params': async function (newValue) {
      if (newValue?.namespace) {
        await this.findQuery(newValue.namespace);
      }
    }
  }
};
</script>
