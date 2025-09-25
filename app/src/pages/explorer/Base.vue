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
    <md-app-content class="u--padding-zero u_height--max">
      <router-view />
    </md-app-content>
  </md-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import Drawer from '@/components/Drawer.vue';
import { HEADER_ROUTES } from '@/modules/nav-routes';

const store = useStore();
const route = useRoute();

// Component name for debugging
defineOptions({
  name: 'ExplorerBase',
});

// Reactive data
const menuVisible = ref<boolean>(false);
const showTop = ref(true);

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

// Lifecycle
onMounted(() => {
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
</script>
