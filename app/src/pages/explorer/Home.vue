<template>
  <div class="u_height--max u--layout-flex-verticalScreen u--layout-flex-column">
    <div class="section_teams u--margin-centered-verticalScreen" v-if="!searchEnabled">
      <div class="search_box">
        <h2 class="search_box_header teams_header">Welcome to MM Explorer</h2>
        <form class="form" @submit.prevent="() => submitSearch()">
          <div class="search_box_form">
            <div class="form__group search_box_form-item-1">
              <input
                type="text"
                ref="search_input"
                class="form__input form__input--adjust"
                autocomplete="off"
                placeholder="Search"
                name="search"
                id="search"
                required
                v-model="searchWord"
              />
              <label htmlFor="search" class="form__label search_box_form_label">Search</label>
            </div>
          </div>
          <div class="form__group search_box_form-item-2 explorer_page-nav u--margin-neg">
            <button
              type="submit"
              class="btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
            >
              Search
            </button>
          </div>
        </form>
        <!-- <div class="search-dropdown-menu_parent" v-if="!!suggestions.length && enableAutosuggest">
					<ul class="search-dropdown-menu" style="width:100%">
						<li v-for="(suggestion, index) in suggestions" :key="index" class="" @click.prevent="submitSearch(suggestion)">
							<a href="#">{{ suggestion }}</a>
						</li>
					</ul>
				</div> -->
        <p class="search_box_text">
          MM Explorer is a research-focused discovery tool that enables collaboration among scholars
          of nano and meta materials. Browse or search information on articles, samples, images,
          charts, etc.
        </p>
      </div>
    </div>
    <div class="explorer_page-container u_margin-top-auto" v-if="!searchEnabled">
      <div class="explorer_page-nav">
        <div class="teams_list explorer_page-list">
          <ul class="utility_flex_mobile">
            <li v-for="link in pageNavLinks" :key="link.text">
              <router-link :to="'/' + link.link" v-slot="{ navigate, href }" custom>
                <div class="teams_container explorer_page-nav-card" :href="href" @click="navigate">
                  <md-icon class="explorer_page-nav-card_icon">{{ link.icon }}</md-icon>
                  <span class="explorer_page-nav-card_text">{{ link.text }}</span>
                </div>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <search-header v-if="searchEnabled" />
    <search-results-table v-if="searchEnabled" />
    <div class="explorer_page_footer u_margin-top-auto">
      <span class="explorer_page_footer-text"
        >&copy; {{ new Date().getFullYear() }} MaterialsMine Project</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useExplorerSearch } from '@/composables/useExplorerSearch';
import SearchHeader from '@/components/explorer/SearchHeader.vue';
import SearchResultsTable from '@/components/explorer/SearchResultsTable.vue';

interface PageNavLink {
  icon: string;
  text: string;
  link: string;
}

const store = useStore();
const { searchWord, searchEnabled, submitSearch } = useExplorerSearch();

const search_input = ref<HTMLInputElement | null>(null);

const pageNavLinks = ref<PageNavLink[]>([
  { icon: 'grid_view', text: 'Gallery', link: 'explorer/visualization' },
  { icon: 'cloud_upload', text: 'Curate', link: 'explorer/curate' },
  { icon: 'help', text: 'Help', link: 'nm/how' },
]);

const disableRender = async (e: Event) => {
  const target = e.target as HTMLElement;
  const selected = target.closest('.search_box');
  if (!selected) {
    await store.commit('explorer/setEnableAutosuggest', false);
  }
};

onMounted(() => {
  document.addEventListener('click', disableRender);
});

onUnmounted(() => {
  document.removeEventListener('click', disableRender);
});

defineOptions({
  name: 'ExplorerHome',
});
</script>
