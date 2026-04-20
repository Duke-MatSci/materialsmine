<template>
  <md-app md-waterfall md-mode="fixed">
    <md-app-toolbar
      class="md-app-toolbar md-large md-dense md-primary md-theme-default"
      id="reset_bg"
      :style="[transition, !showTop && hideHeaderView]"
    >
      <div class="md-toolbar-row">
        <div class="md-toolbar-section-start">
          <md-button class="md-icon-button" @click="toggleMenuVisibility">
            <md-icon>menu</md-icon>
          </md-button>

          <router-link to="/" class="header-logo">
            <span class="md-title"
              ><img id="logo" src="@/assets/img/materialsmine_logo_sm.png"
            /></span>
          </router-link>
        </div>

        <div class="md-toolbar-section-end md-toolbar-section-end_adjust">
          <div class="nav nav_menu u--inline">
            <ul>
              <li>
                <router-link to="/nm" v-slot="{ navigate, href }" custom>
                  <a :href="href" @click="navigate">NanoMine</a>
                </router-link>
              </li>
              <li>
                <router-link to="/mm" v-slot="{ navigate, href }" custom>
                  <a :href="href" @click="navigate">Metamine</a>
                </router-link>
              </li>
              <li>
                <span v-if="isAuth" class="u_color_white u--font-emph-m">
                  Hi {{ displayName }}
                </span>
                <a
                  v-if="!isAuth"
                  class="md-icon-button large u_color_white u--font-emph-m u_margin-top-small"
                  href="/secure"
                >
                  Login
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Toolbar Tabs -->
      <div class="md-toolbar-row u_margin-top-med u_toggle-display-off">
        <md-tabs class="md-primary" id="reset_tab_bg" md-sync-route>
          <md-tab
            class="_menutabs"
            v-for="(route, i) in tabRoutes"
            :key="i"
            :to="route.path"
            :id="`tab-${route.name || route.label}`"
            :md-label="route.label"
            :exact="route.exact"
          />
        </md-tabs>
      </div>
    </md-app-toolbar>
    <md-app-drawer v-model:mdActive="menuVisible">
      <Drawer id="leftdrawer" />
    </md-app-drawer>
    <md-app-content
      class="u--padding-zero u--layout-flex u--layout-flex-column utility-roverflow"
    >
      <div class="section_loader" v-if="loading">
        <Spinner :loading="loading" text="Loading Ontology Data" />
      </div>
      <template v-else>
        <router-view v-if="!namespace" />

        <template v-else>
          <Classes v-if="!searchLoading && searchResult" />
          <Home v-else />
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

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import Drawer from '@/components/Drawer.vue';
import Spinner from '@/components/Spinner.vue';
import Classes from '@/pages/ns/Classes.vue';
import Home from '@/pages/ns/Home.vue';
import { HEADER_ROUTES } from '@/modules/nav-routes';

const store = useStore();
const route = useRoute();

// Component name for debugging
defineOptions({
  name: 'NameSpaceBase',
});

// Reactive data
const menuVisible = ref<boolean>(false);
const showTop = ref(true);
const searchLoading = ref(true);

// Auth state
const isAuth = computed(() => store.getters['auth/isAuthenticated']);
const displayName = computed(() => store.getters['auth/displayName']);

// Tabs
const tabRoutes = computed(() => {
  const routeParent = route.path.split('/')[1] as keyof typeof HEADER_ROUTES;
  const routes = HEADER_ROUTES?.[routeParent] ?? [];
  return routes;
});

// Computed
const loading = computed(() => store.getters['ns/isLoading']);
const searchResult = computed(() => store.state.ns.currentClass);
const namespace = computed(() => route.params?.namespace);
const getBody = computed(() => {
  return document.querySelector('.md-app.md-fixed .md-app-scroller');
});

// Methods
const toggleMenuVisibility = (): void => {
  menuVisible.value = !menuVisible.value;
};

const hideHeaderView = computed(() => ({ top: `-${74}px` }));
const transition = computed(() => ({ transition: `all ${0.2}s linear` }));

const adjustHeader = () => {
  const bodyElement = getBody.value as HTMLElement;
  const scrollHeight = bodyElement?.scrollTop || 0;
  if (window.innerWidth < 650) return;
  showTop.value = !(scrollHeight > 100);
  const offset = scrollHeight > 100 ? '-74px' : '0px';
  if (bodyElement) {
    bodyElement.style.position = 'relative';
    bodyElement.style.marginTop = offset;
    bodyElement.style.paddingBottom = offset;
  }
};

const findQuery = async (query: string | string[]) => {
  searchLoading.value = true;
  store.commit('ns/clearCurrentClass');
  await nextTick();
  store.dispatch('ns/searchNSData', { query, singleResult: true });
  if (searchResult.value) {
    store.commit('ns/setSelectedId', searchResult.value.ID);
  }
  searchLoading.value = false;
};

// Lifecycle
onMounted(async () => {
  await store.dispatch('ns/fetchNsData');
  if (namespace.value) await findQuery(namespace.value);

  nextTick(() => {
    if (getBody.value) {
      getBody.value.addEventListener('scroll', adjustHeader);
    }
  });
});

onBeforeUnmount(() => {
  if (getBody.value) {
    getBody.value.removeEventListener('scroll', adjustHeader);
  }
});

// Watchers
watch(
  () => route.params,
  async (newValue) => {
    if (newValue?.namespace) {
      await findQuery(newValue.namespace);
    }
  }
);
</script>
