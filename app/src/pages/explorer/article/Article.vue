<template>
  <div class="section_pages">
    <div v-if="!loading && !error.article" class="wrapper" key="article_loaded">
      <h1 class="visualize_header-h1 article_title">{{ article.title }}</h1>
      <div class="article_authors">{{ article.authorNames }}</div>
      <div v-if="article.venue" class="article_metadata article_venue" key="article_venue">
        <span class="article_metadata_strong">{{ article.venue }}</span> ({{ article.year }})
      </div>
      <div v-else class="article_metadata article_year" key="article_no_venue">
        {{ article.year }}
      </div>
      <div class="article_abstract teams_text">
        <h3>Abstract</h3>
        <p>{{ article.abstract }}</p>
      </div>
      <div class="article_metadata article_doi">
        DOI: <a :href="doiLink" target="_blank">{{ doi }}</a>
      </div>
      <div class="article_metadata article_citation_count">
        Cited by <span class="article_metadata_strong">{{ article.citationCount }}</span> other works.
      </div>
      <div v-if="!error.references" class="article_references" key="references_loaded">
        <div class="article_subtitle">References</div>
        <div class="article_table">
          <table class="article_table">
            <thead>
              <tr class="article_table-header">
                <th scope="col">Year</th>
                <th scope="col">Author(s)</th>
                <th scope="col">Title</th>
              </tr>
            </thead>
            <tbody>
              <tr
                class="article_table-row"
                v-for="(refObject, index) of article.references?.data || []"
                :key="refObject.paperId || index"
              >
                <td>{{ refObject.year }}</td>
                <td>{{ refObject.authorNames }}</td>
                <td>{{ refObject.title }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="article_references article_error" key="references_error">
        <div class="article_subtitle">References failed to load. Please try again in a moment.</div>
      </div>
      <div v-if="!error.citations" class="article_citations" key="citations_loading">
        <div class="article_subtitle">Cited By</div>
        <div class="article_table">
          <table>
            <thead>
              <tr class="article_table-header">
                <th scope="col">Year</th>
                <th scope="col">Author(s)</th>
                <th scope="col">Title</th>
              </tr>
            </thead>
            <tbody>
              <tr
                class="article_table-row"
                v-for="(refObject, index) of article.citations?.data || []"
                :key="refObject.paperId || index"
              >
                <td>{{ refObject.year }}</td>
                <td>{{ refObject.authorNames }}</td>
                <td>{{ refObject.title }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="article_citations" key="citations_error">
        <div class="article_subtitle article_error">
          Citations failed to load. Please try again in a moment.
        </div>
      </div>
    </div>
    <div
      v-else-if="loading && !error.article"
      class="section_loader wrapper article_error"
      key="article_loading"
    >
      <Spinner :loading="loading && !error.article" text="Loading Article" />
    </div>
    <div v-else class="wrapper article_title" key="article_title article_error">
      <h1>Error retrieving this article.</h1>
      <p>Error: {{ error.article }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import articleMetadata from '@/modules/explorer/article/services/articleMetadata';
import Spinner from '@/components/Spinner.vue';

// Component name for debugging
defineOptions({
  name: 'ArticlePage',
});

// Route
const route = useRoute();

// Reactive data
interface ArticleData {
  title?: string;
  authorNames?: string;
  venue?: string;
  year?: number;
  abstract?: string;
  citationCount?: number;
  references?: {
    ok: boolean;
    status?: number;
    statusText?: string;
    error?: string;
    data: any[];
  };
  citations?: {
    ok: boolean;
    status?: number;
    statusText?: string;
    error?: string;
    data: any[];
  };
}

interface ErrorState {
  article?: string | boolean;
  citations?: string | boolean;
  references?: string | boolean;
}

const article = ref<ArticleData>({});
const loading = ref(false);
const error = ref<ErrorState>({});

// Computed properties
const doi = computed(() => {
  if (route.params.doi) {
    return route.params.doi as string;
  }
  return null;
});

const doiLink = computed(() => {
  if (doi.value) {
    return new URL(doi.value, 'https://www.doi.org').toString();
  }
  return '';
});

// Methods
/**
 * Checks if articleMetadata.get() returned any error.
 * @param {string} prop Part of article object to check
 * @returns As much information as is available for the error, if any.
 */
const getError = (prop: 'article' | 'citations' | 'references'): string | boolean => {
  let base: any;
  if (prop === 'article') {
    base = article.value;
  } else {
    base = article.value[prop];
  }
  if (!base) {
    // if metadata wasn't returned, error is unclear
    return true;
  } else if (!base.ok) {
    // fetch responded with error, or API did
    return base.error || `${base.status} ${base.statusText}`;
  } else {
    // no error detected
    return false;
  }
};

const fetchData = async () => {
  loading.value = true;
  error.value = {};
  article.value = {};

  if (doi.value) {
    try {
      article.value = await articleMetadata.get({ doi: doi.value });
      loading.value = false;

      // ensure all parts were provided, set error flags if not
      error.value = {
        article: getError('article'),
        citations: getError('citations'),
        references: getError('references'),
      };
    } catch (err: any) {
      // pass error message on to user
      error.value = {
        article: err.message,
        citations: true,
        references: true,
      };
      loading.value = false;
    }
  }
};

// Watchers
watch(doi, () => {
  fetchData();
});

// Lifecycle
onMounted(() => {
  fetchData();
});
</script>
