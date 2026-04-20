<template>
  <div class="gallery">
    <spinner :loading="getIsloading" text="Loading..." v-if="getIsloading" />
    <div class="utility-roverflow explorer_page-results metadata" v-else>
      <!-- Articles -->
      <div v-if="resultsTab === 'getArticles'" class="grid_explorer-fullrow" ref="articles_ref">
        <div
          v-for="(result, index) in getArticles"
          :key="index"
          class="btn--animated md-card gallery-item results_card u--font-emph-900"
        >
          <MdCardHeader style="padding: 0px">
            <router-link
              @click="fixUriBeforeRouting(result.identifier, 'http://dx.doi.org/')"
              to="#"
              class="results_card-title"
            >
              <div>{{ result.label }}</div>
            </router-link>
            <div>
              <div class="results_card-type">Articles</div>
              <div class="md-body-1 results_card-description">
                {{ result.identifier }}
              </div>
            </div>
          </MdCardHeader>
        </div>
      </div>

      <!-- Samples -->
      <div class="grid_explorer-fullrow" v-if="resultsTab === 'getSamples'" ref="samples_ref">
        <div
          v-for="(result, index) in getSamples"
          :key="index"
          class="btn--animated md-card gallery-item results_card u--font-emph-900"
          ref="sample_ref"
        >
          <MdCardHeader style="padding: 0px">
            <MdAvatar v-if="result.thumbnail">
              <img
                :src="baseUrl + '/api/files/' + result.thumbnail.split('=')[1]"
                :alt="result.label"
                v-if="result.thumbnail"
              />
            </MdAvatar>

            <router-link
              @click="fixUriBeforeRouting(result.identifier, 'http://materialsmine.org/sample/')"
              to="#"
              class="results_card-title"
            >
              <div>{{ result.label }}</div>
            </router-link>
            <div>
              <div class="results_card-type">Samples</div>
              <div class="md-body-1 results_card-description" v-if="result.description">
                {{ reduceDescription(result.description) }}
              </div>
              <div class="md-body-1 results_card-description" v-else-if="result.identifier">
                {{ result.identifier }}
              </div>
            </div>
          </MdCardHeader>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid_explorer-boxes" v-if="resultsTab === 'getCharts'" ref="charts_ref">
        <div
          v-for="(result, index) in getCharts"
          :key="index"
          class="btn--animated md-card gallery-item results_card u--font-emph-900"
        >
          <div class="utility-gridicon_explorer" v-if="resultsTab === 'getCharts'">
            <div @click.prevent="bookmark(result.name, true)" v-if="result.bookmark">
              <MdIcon>bookmark</MdIcon>
            </div>
            <div @click.prevent="bookmark(result.name, false)" v-else>
              <MdIcon>bookmark_border</MdIcon>
            </div>
          </div>

          <MdCardMediaCover md-solid>
            <MdCardMedia md-ratio="4:3" v-if="result.thumbnail">
              <img
                :src="baseUrl + '/api/knowledge/images?uri=' + result.thumbnail"
                :alt="result.label"
                v-if="result.thumbnail"
              />
            </MdCardMedia>
            <MdIcon v-else class="md-size-5x"> image </MdIcon>
          </MdCardMediaCover>

          <MdCardHeader style="padding: 0px">
            <router-link
              @click="fixUriBeforeRouting(result.identifier, 'http://nanomine.org/viz/')"
              to="#"
              class="results_card-title"
            >
              <div>{{ result.label }}</div>
            </router-link>
            <div>
              <div class="results_card-type">Charts</div>
              <div class="md-body-1 results_card-description" v-if="result.description">
                {{ reduceDescription(result.description) }}
              </div>
              <div class="md-body-1 results_card-description" v-else-if="result.identifier">
                {{ result.identifier }}
              </div>
            </div>
          </MdCardHeader>
        </div>
      </div>

      <!-- Images -->
      <div class="grid_explorer-boxes" v-if="resultsTab === 'getImages'" ref="images_ref">
        <div
          v-for="(result, index) in getImages"
          :key="index"
          class="btn--animated md-card gallery-item results_card u--font-emph-900"
        >
          <MdCardMediaCover md-solid>
            <MdCardMedia md-ratio="4:3" v-if="result.thumbnail">
              <img
                :src="baseUrl + '/api/knowledge/images?uri=' + result.thumbnail"
                :alt="result.label"
                v-if="result.thumbnail"
              />
            </MdCardMedia>
            <MdIcon v-else class="md-size-5x"> image </MdIcon>
          </MdCardMediaCover>

          <MdCardHeader style="padding: 0px">
            <router-link
              @click="fixUriBeforeRouting(result.identifier, 'http://nanomine.org/image/')"
              to="#"
              class="results_card-title"
            >
              <div>{{ result.label }}</div>
            </router-link>
            <div>
              <div class="results_card-type">Images</div>
              <div class="md-body-1 results_card-description" v-if="result.description">
                {{ reduceDescription(result.description) }}
              </div>
              <div class="md-body-1 results_card-description" v-else-if="result.identifier">
                {{ result.identifier }}
              </div>
            </div>
          </MdCardHeader>
        </div>
      </div>

      <!-- Materials/Properties -->
      <div class="grid_explorer-fullrow" v-if="resultsTab === 'getMaterials'" ref="materials_ref">
        <div
          v-for="(result, index) in getMaterials"
          :key="index"
          class="btn--animated md-card gallery-item results_card u--font-emph-900"
        >
          <MdCardHeader style="padding: 0px">
            <router-link
              @click="fixUriBeforeRouting(result.identifier, 'http://materialsmine.org/property/')"
              to="#"
              class="results_card-title"
            >
              <div>{{ result.label }}</div>
            </router-link>
            <div>
              <div class="results_card-type">Properties</div>
              <div class="md-body-1 results_card-description" v-if="result.description">
                {{ reduceDescription(result.description) }}
              </div>
              <div class="md-body-1 results_card-description" v-else-if="result.identifier">
                {{ result.identifier }}
              </div>
            </div>
          </MdCardHeader>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useReduce } from '@/composables/useReduce';
import Spinner from '@/components/Spinner.vue';

const store = useStore();
const router = useRouter();
const { reduceDescription } = useReduce();

// Reactive data
const loadError = ref(false);
const otherArgs = ref(null);
const defaultImg = ref('');
const baseUrl = ref(window.location.origin);

// Template refs
const articles_ref = ref<HTMLElement | null>(null);
const samples_ref = ref<HTMLElement | null>(null);
const charts_ref = ref<HTMLElement | null>(null);
const images_ref = ref<HTMLElement | null>(null);
const materials_ref = ref<HTMLElement | null>(null);
const sample_ref = ref<HTMLElement | null>(null);

// Computed properties
const resultsTab = computed(() => store.getters['explorer/getResultsTab']);
const getArticles = computed(() => store.getters['explorer/results/getArticles']);
const getSamples = computed(() => store.getters['explorer/results/getSamples']);
const getImages = computed(() => store.getters['explorer/results/getImages']);
const getCharts = computed(() => store.getters['explorer/results/getCharts']);
const getMaterials = computed(() => store.getters['explorer/results/getMaterials']);
const getTotal = computed(() => store.getters['explorer/results/getTotal']);
const getIsloading = computed(() => store.getters['explorer/results/getIsloading']);

// Methods
const loadProperties = async (selectedValue: string) => {
  await store.dispatch('explorer/searchFacetFilterMaterials', selectedValue);
};

const fixUriBeforeRouting = (address: string, prefix: string) => {
  if (address && prefix) {
    const identifier = address.replace(prefix, '');
    if (resultsTab.value === 'getArticles') {
      return router.push(`/explorer/article/${identifier}`);
    } else if (resultsTab.value === 'getSamples') {
      return router.push(`/explorer/sample/${identifier}`);
    } else if (resultsTab.value === 'getCharts') {
      return router.push(`/explorer/chart/view/${encodeURIComponent(identifier)}`);
    } else if (resultsTab.value === 'getImages') {
      return router.push(`/explorer/images/${address}/${encodeURIComponent(prefix)}`);
    }
  }
};

// Placeholder bookmark method (not implemented in original)
const bookmark = (name: string, isBookmarked: boolean) => {
  console.log('Bookmark functionality not implemented:', name, isBookmarked);
};

defineOptions({
  name: 'SearchResultsTable',
});
</script>
