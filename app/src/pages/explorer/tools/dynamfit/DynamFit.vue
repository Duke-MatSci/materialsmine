<template>
  <article class="u_width--max">
    <header aria-label="tri-ve-header" class="explorer_page_header">
      <h1 class="visualize_header-h1 u_margin-top-med u_centralize_text">
        Tri-VE
      </h1>
    </header>
    <main
      aria-label="tri-ve-main"
      class="u--margin-posmd md-layout md-alignment-top-space-around u_relative"
    >
      <!-- <div
        class="viz-u-postion__abs header_404_nav"
        style="top: -3rem; right: 2rem; z-index: 1000"
      >
        <a class="btn-text" href="#" v-on:click="toggleDialogBox"
          >Toggle C1/C2</a
        >
      </div> -->
      <!-- aside  -->
      <aside
        aria-label="tri-ve-setting"
        class="md-layout-item md-size-25 md-medium-size-35 md-small-size-100 md-xsmall-size-100 u_height--auto"
      >
        <ChartSetting />
      </aside>
      <!-- main  -->
      <section
        aria-label="tri-ve-data"
        class="md-layout-item md-size-70 md-medium-size-60 md-small-size-100 md-xsmall-size-100 u_height--auto"
      >
        <ChartVisualizer @change-file="onChangeFileRequest" @surprise-me="onSurpriseMe" />
      </section>
    </main>
    <dialogbox :active="dialogBoxActive" :minWidth="40">
      <template v-slot:title>{{ dialog.title }}</template>
      <template v-slot:content>
        <div v-if="dialog.type === 'select'">
          <select
            class="form__input form__input--adjust utility-padding-sm"
            v-model="selectedProp"
          >
            <option value="select">Select Domain</option>
            <option value="c1">C1</option>
            <option value="c2">C2</option>
          </select>
        </div>
        <div v-else-if="dialog.type === 'changeFile'">
          Are you sure you want to remove the current file? This will clear the
          chart data and allow you to upload a new file.
        </div>
      </template>
      <template v-slot:actions>
        <template v-if="dialog.type === 'select'">
          <md-button @click.prevent="toggleDialogBox">Submit</md-button>
          <md-button @click.prevent="toggleDialogBox">Close</md-button>
        </template>
        <template v-else-if="dialog.type === 'changeFile'">
          <md-button @click.prevent="confirmChangeFile">Yes, Change</md-button>
          <md-button @click.prevent="toggleDialogBox">Cancel</md-button>
        </template>
      </template>
    </dialogbox>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import ChartSetting from '@/components/explorer/dynamfit/ChartSetting.vue';
import ChartVisualizer from '@/components/explorer/dynamfit/ChartVisualizer.vue';
import Dialog from '@/components/Dialog.vue';

// Component name for debugging
defineOptions({
  name: 'TriVE',
});

// This app has no route-title machinery, so the page sets (and restores) its own.
let previousTitle = '';
onMounted(() => {
  previousTitle = document.title;
  document.title = 'Tri-VE — MaterialsMine';
});
onBeforeUnmount(() => {
  if (previousTitle) document.title = previousTitle;
});

// Components
const dialogbox = Dialog;

// Store
const store = useStore();

// Reactive state
const selectedProp = ref('select');
const isTemp = ref(true);
const dialog = ref({
  title: 'Select',
  type: 'select',
});

// Computed properties
const dialogBoxActive = computed(() => store.getters.dialogBox);

// Methods
const toggleDialogBox = (): void => {
  store.commit('setDialogBox');
};

const onChangeFileRequest = (): void => {
  dialog.value = { title: 'Change Data File', type: 'changeFile' };
  toggleDialogBox();
};

const onSurpriseMe = (): void => {
  store.commit('explorer/triggerDynamfitSurprise');
};

const confirmChangeFile = async (): Promise<void> => {
  toggleDialogBox();
  const dynamfit = store.getters['explorer/dynamfit'];
  const name = dynamfit?.fileUpload;
  if (!name) return;

  store.commit('resetSnackbar');

  if (name !== 'test.tsv') {
    const { deleted, error } = await store.dispatch('deleteFile', {
      name,
      isTemp: isTemp.value,
    });
    if (error || !deleted) return;
  }

  store.commit('explorer/resetDynamfit');
  store.commit('explorer/resetDynamfitData');
  store.commit('explorer/setDynamfitManualFile', '');
  store.commit('explorer/resetDynamfitShiftCoefficients');
  store.commit('explorer/setDynamfitSourceType', '');
};
</script>
