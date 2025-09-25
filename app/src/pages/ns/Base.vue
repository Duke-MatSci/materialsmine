<template>
  <md-app md-waterfall md-mode="fixed">
    <md-app-toolbar
      class="md-app-toolbar md-large md-dense md-primary md-theme-default"
      id="reset_bg"
      :style="[transition, !showTop && hideHeaderView]"
    >
      <app-toolbar :toggler="toggleMenuVisibility" />
    </md-app-toolbar>
    <md-app-drawer v-model:mdActive="menuVisible">
      <Drawers />
    </md-app-drawer>
    <md-app-content class="u--padding-zero u--layout-flex u--layout-flex-column utility-roverflow">
      <div class="section_loader" v-if="loading">
        <spinner :loading="loading" text="Loading Ontology Data" />
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
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import Drawers from '@/components/Drawer.vue';
import AppToolbar from '@/components/explorer/Header.vue';
import spinner from '@/components/Spinner.vue';
import Classes from '@/pages/ns/Classes.vue';
import Home from '@/pages/ns/Home.vue';

// Component name for debugging
defineOptions({
  name: 'NameSpaceBase',
});

const store = useStore();
const route = useRoute();

// Reactive data
const menuVisible = ref<boolean>(false);
const showTop = ref<boolean>(true);
const searchLoading = ref<boolean>(true);

// Computed properties
const loading = computed(() => store.getters['ns/isLoading']);
const searchResult = computed(() => store.state.ns.currentClass);
const namespace = computed(() => route.params?.namespace as string);
const getBody = computed(() => {
  return document.querySelector('.md-app.md-fixed .md-app-scroller');
});

// Methods
const toggleMenuVisibility = (): void => {
  menuVisible.value = !menuVisible.value;
};

const handleDrawerUpdate = (value: boolean): void => {
  menuVisible.value = value;
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

const findQuery = async (query: string) => {
  searchLoading.value = true;
  store.commit('ns/clearCurrentClass');
  await nextTick();
  await store.dispatch('ns/searchNSData', { query, singleResult: true });
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
      await findQuery(newValue.namespace as string);
    }
  }
);
</script>
