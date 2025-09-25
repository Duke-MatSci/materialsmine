<template>
  <div
    class="u_width--max utility-bg_border-dark md-card-header u--b-rad"
    :class="{ 'utility-roverflow': !isListVisible }"
    :style="!isListVisible ? limitHeight : ''"
  >
    <div class="viz-u-postion__rel">
      <div class="u--layout-flex u--layout-flex-justify-sb u_centralize_items">
        <h1 class="md-subheading"><strong>Classes</strong></h1>
        <button
          type="button"
          data-test="toggle-list"
          @click.prevent="isListVisible = !isListVisible"
          class="md-button md-icon-button md-dense md-theme-default"
        >
          <div class="md-ripple">
            <div class="md-button-content">
              <MdIcon class="utility-color">{{
                isListVisible ? 'keyboard_arrow_up' : 'keyboard_arrow_down'
              }}</MdIcon>
            </div>
          </div>
        </button>
      </div>
      <MdField style="align-items: baseline">
        <p><strong>Jump to:</strong></p>
        &nbsp;
        <MdInput v-model="searchKeyword" id="namespace"></MdInput>
        <MdButton aria-disabled="true" disabled class="md-icon-button md-dense">
          <MdIcon>search</MdIcon>
        </MdButton>
      </MdField>

      <template v-if="!!searchResult.length">
        <div class="search-dropdown-menu" :style="setDropdownPosition">
          <button
            v-for="(obj, index) in searchResult"
            :key="index"
            @click.prevent="showClassInfo(obj['ID'])"
            style="white-space: wrap"
            class="btn-text md-button-clean viz-u-display__show u_width--max md-card-actions search_box_form_label u_pointer"
          >
            <span>
              <strong>{{ obj['Preferred Name'] }}</strong></span
            >
          </button>
        </div>
      </template>
    </div>

    <NamespaceAccordion
      v-for="obj in classes"
      :key="obj['ID']"
      :id="obj['ID']"
      :summary="obj['Preferred Name']"
      :class-info="obj"
      :child="obj['subClasses']"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import NamespaceAccordion from '@/components/ns/classes/NamespaceAccordion.vue';

// Component name for debugging
defineOptions({
  name: 'ClassesList',
});

const store = useStore();
const router = useRouter();

// Reactive data
const loading = ref<boolean>(false);
const searchKeyword = ref<string>('');
const isListVisible = ref<boolean>(true);

// Computed properties
const classes = computed(() => store.getters['ns/getClasses']);
const currentClass = computed(() => store.getters['ns/getCurrentClass']);
const searchResult = computed(() => store.getters['ns/getSearchResults']);

const setDropdownPosition = computed(() => {
  return { top: 100 + '%', zIndex: 10, right: 0, minHeight: 'auto' };
});

const limitHeight = computed(() => {
  return { maxHeight: 6 + 'rem' };
});

// Methods
const toggleClass = (id: string) => {
  const element = document.getElementById(id);
  if (!element) return;
  element.classList.toggle('u--alt-bg');
  openAncestor(id);
};

const openAncestor = (id: string) => {
  const element = document.getElementById(id);
  let parent = element?.parentElement;
  while (parent) {
    if (parent.tagName.toLowerCase() === 'details') {
      (parent as HTMLDetailsElement).open = true;
    }
    parent = parent.parentElement;
  }
};

const showClassInfo = (id: string) => {
  const url = `/ns/${id.split('/').pop()?.split('#').pop()}`;
  router.push(url);
};

const submitSearch = async () => {
  const query = searchKeyword.value;
  if (query.length < 3) {
    return store.commit('ns/clearSearchQueries');
  }
  await store.dispatch('ns/searchNSData', {
    query,
    singleResult: false,
  });
};

// Lifecycle
onMounted(() => {
  toggleClass(store.state.ns.selectedId);
});

// Watchers
watch(searchKeyword, () => {
  submitSearch();
});
</script>
