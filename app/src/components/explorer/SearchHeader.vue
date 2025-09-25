<template>
  <div class="explorer_page_header metadata">
    <MdCard style="padding: 2rem; margin: 2rem; z-index: 10">
      <form class="form" @submit.prevent="() => submitSearch()" autocomplete="off">
        <div class="search_box_form">
          <div class="form__group search_box_form-item-1">
            <input
              type="text"
              ref="search_input"
              class="form__input form__input--adjust"
              placeholder="Search"
              name="search"
              id="search"
              required
              v-model="searchWord"
            />
            <label htmlFor="search" class="form__label search_box_form_label">Search</label>
          </div>
          <div class="form__group search_box_form-item-2">
            <button type="submit" class="btn btn--primary btn--noradius search_box_form_btn">
              Search
            </button>
          </div>
        </div>
      </form>
      <!-- <div class="search-dropdown-menu_parent" v-if="!!suggestions.length">
        <ul class="search-dropdown-menu">
          <li v-for="(suggestion, index) in suggestions" :key="index" class="" @click.prevent="submitSearch(suggestion)">
            <a href="#">{{ suggestion }}</a>
          </li>
        </ul>
      </div> -->
      <div style="text-align: right" v-if="getTotal > 1">
        <strong>{{ getTotal }}</strong> results for "{{ searchWord }}"
      </div>
      <div style="text-align: right" v-else>
        Found {{ getTotal }} result for query "{{ searchWord }}"
      </div>
    </MdCard>
    <MdTabs class="btn--primary dialog-box_content">
      <MdTab
        :md-label="'Articles (' + passTotal.getArticles + ')'"
        @click.prevent="setResultsTabs('getArticles')"
      ></MdTab>
      <MdTab
        :md-label="'Samples (' + passTotal.getSamples + ')'"
        @click.prevent="setResultsTabs('getSamples')"
      ></MdTab>
      <MdTab
        :md-label="'Images (' + imageTotal + ')'"
        @click.prevent="setResultsTabs('getImages')"
      ></MdTab>
      <MdTab
        :md-label="'Charts (' + passTotal.getCharts + ')'"
        @click.prevent="setResultsTabs('getCharts')"
      ></MdTab>
      <MdTab
        :md-label="'Properties (' + passTotal.getMaterials + ')'"
        @click.prevent="setResultsTabs('getMaterials')"
      ></MdTab>
    </MdTabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useExplorerSearch } from '@/composables/useExplorerSearch';

const store = useStore();
const { searchWord, submitSearch, setResultsTab } = useExplorerSearch();

const search_input = ref<HTMLInputElement | null>(null);

// Computed properties
const resultsTab = computed(() => store.getters['explorer/getResultsTab']);
const passTotal = computed(() => store.getters['explorer/results/getTotalGroupings']);
const getTotal = computed(() => store.getters['explorer/results/getTotal']);

const imageTotal = computed(() => {
  return passTotal.value?.getImages ?? 0;
});

// Methods
const setResultsTabs = (payload: string) => {
  return setResultsTab(payload);
};

defineOptions({
  name: 'SearchHeader',
});
</script>
