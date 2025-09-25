<template>
  <div class="image-detail-page">
    <div class="section_loader" v-if="loading">
      <Spinner :loading="loading" text="Loading Images" />
    </div>
    <div class="utility-roverflow" v-else-if="getSingleImages && getSingleImages.images">
      <div class="utility-content__result teams_partner">
        <div class="utility-space search_box_form u--layout-flex-justify-end">
          <md-button id="navbackBtn" class="md-icon-button" @click.prevent="navBack">
            <md-tooltip> Go Back </md-tooltip>
            <md-icon>arrow_back</md-icon>
          </md-button>
          <md-button
            id="shareChartBtn"
            class="md-icon-button"
            @click.prevent="handleShare(`${baseUrl}${router.currentRoute.value.fullPath}`)"
          >
            <md-tooltip> {{ shareToolTip }} </md-tooltip>
            <md-icon>share</md-icon>
          </md-button>
        </div>
      </div>

      <md-card
        v-if="currentImage"
        md-theme="green-card"
        class="md-primary u--shadow-none u--padding-zero-mobile"
      >
        <md-card-header class="section_md-header">
          <md-card-header-text class="section_text-col flex-item">
            <div class="md-title u--margin-header">
              {{ currentImage.description || 'Polymer nanocomposite image' }}
            </div>
            <div v-if="currentImage.metaData.doi">
              DOI:
              <a class="u--b-rad" @click="nav_to_doi(currentImage.metaData.doi)">{{
                currentImage.metaData.doi
              }}</a>
              <div class="md-subhead u--margin-header">{{ currentImage.metaData.title }}</div>
              <button
                class="btn btn--primary search_box_form_btn mid-first-li display-text u--b-rad"
                @click="nav_to_doi_images(currentImage.metaData.doi)"
              >
                more from this DOI
              </button>
            </div>
          </md-card-header-text>
          <div class="quicklinks_content flex-item u--padding-zero" style="max-width: 50rem">
            <img
              :src="currentImage.file"
              :alt="currentImage.metaData.title"
              class="facet_viewport img"
            />
          </div>
        </md-card-header>
      </md-card>

      <div
        class="search_box_form image-detail-page-tab u--layout-flex-justify-fs u--margin-centered u--font-emph-smm u--margin-bottommd u--color-grey-sec u--dimension-size-m u--margin-leftsm"
      >
        <div
          @click="nav_to_tab"
          name="ri_active"
          :class="{
            'u--margin-rightmd': true,
            'section_tabb-controller': !tabbed_content.ri_active,
            u_pointer: true,
            'u--padding-rl-xs': true,
          }"
        >
          Related Images
        </div>
        <div
          @click="nav_to_tab"
          name="kw_active"
          :class="{
            'u--margin-rightmd': true,
            'section_tabb-controller': !tabbed_content.kw_active,
            u_pointer: true,
            'u--padding-rl-xs': true,
          }"
        >
          Keywords
        </div>
        <div
          @click="nav_to_tab"
          name="md_active"
          :class="{
            'u--margin-rightmd': true,
            'section_tabb-controller': !tabbed_content.md_active,
            u_pointer: true,
            'u--padding-rl-xs': true,
          }"
        >
          Metadata
        </div>
        <div
          @click="nav_to_tab"
          name="au_active"
          :class="{
            'u--margin-rightmd': true,
            'section_tabb-controller': !tabbed_content.au_active,
            u_pointer: true,
            'u--padding-rl-xs': true,
          }"
        >
          Authors
        </div>
      </div>

      <div>
        <div
          id="related-images"
          :class="{
            search_box_form: true,
            'u--layout-flex-justify-se': true,
            explorer_page_header: true,
            'u--layout-flex-switch': tabbed_content.ri_active,
          }"
        >
          <div class="search_box_form howto_item-header">
            <md-button
              :class="{ 'md-icon-button': true, 'u--layout-hide': hideAssetNavLeft }"
              @click.prevent="reduceAsset('prev')"
            >
              <md-tooltip> Show Left </md-tooltip>
              <md-icon>arrow_back</md-icon>
            </md-button>

            <div class="section_md-header u_display-flex image-detail-page__relatedImg">
              <md-card
                v-for="(image, index) in assetItems"
                class="md-card-class u--margin-none"
                :class="`charts-${index + 1} charts-${index + 1}-narrow`"
                :key="`card_${index}`"
              >
                <md-card-media-cover md-solid>
                  <md-card-media md-ratio="16:9">
                    <img
                      :src="baseUrl + image.file"
                      :alt="image.metaData.title"
                      @click="updateCurrentImage(image.file)"
                      class="u_pointer"
                    />
                  </md-card-media>

                  <md-card-area class="u_gridbg">
                    <md-card-header class="u_show_hide">
                      <span class="md-subheading">
                        <strong>{{
                          reduceDescription(image.description || 'polymer nanocomposite', 2)
                        }}</strong>
                      </span>
                      <span class="md-body-1">
                        {{ reduceDescription(image.metaData.title || 'polymer nanocomposite', 8) }}
                      </span>
                    </md-card-header>
                  </md-card-area>
                </md-card-media-cover>
              </md-card>
            </div>

            <md-button
              id="shareChartBtn"
              :class="{ 'md-icon-button': true }"
              @click.prevent="reduceAsset('next')"
            >
              <md-tooltip> Show Right </md-tooltip>
              <md-icon>arrow_forward</md-icon>
            </md-button>
          </div>
        </div>

        <div
          id="keyword"
          :class="{
            search_box_form: true,
            'u--layout-flex-justify-se': true,
            explorer_page_header: true,
            'u--layout-flex-switch': tabbed_content.kw_active,
            'image-detail-page-details-flex-item-col': true,
          }"
        >
          <button
            v-for="word in getSingleImages.images[0].metaData.keywords"
            :key="word"
            @click="nav_to_keyword(word)"
            class="btn btn--primary search_box_form_btn mid-first-li display-text u--b-rad u--margin-pos"
          >
            {{ word }}
          </button>
        </div>

        <div
          v-if="currentImage"
          id="metadata"
          :class="{
            search_box_form: true,
            'u--layout-flex-justify-se': true,
            explorer_page_header: true,
            'u--layout-flex-switch': tabbed_content.md_active,
            metadata: true,
          }"
        >
          <div class="u--margin-pos">
            <span class="u--font-emph-xl u--color-black"> Microscopy: </span>
            <span id="microscropy" class="u--font-emph-xl u--color-grey-sec">
              {{ currentImage.microscopyType || 'N/A' }}
            </span>
          </div>
          <div class="u--margin-pos">
            <span class="u--font-emph-xl u--color-black"> Dimension: </span>
            <span class="u--font-emph-xl u--color-grey-sec">
              width: {{ currentImage.dimension.width || 'N/A' }} | height:
              {{ currentImage.dimension.height || 'N/A' }}
            </span>
          </div>
          <div class="u--margin-pos">
            <span class="u--font-emph-xl u--color-black"> Type: </span>
            <span class="u--font-emph-xl u--color-grey-sec">
              {{ currentImage.type || 'N/A' }}
            </span>
          </div>
        </div>

        <div
          v-if="currentImage"
          id="authors"
          :class="{
            search_box_form: true,
            'u--layout-flex-justify-se': false,
            explorer_page_header: true,
            'u--layout-flex-switch': tabbed_content.au_active,
          }"
        >
          <div v-for="(author, index) in currentImage.metaData.authors" :key="index">
            <span> {{ index == 0 ? '' : '; ' }} {{ author }} </span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="utility-roverflow u_centralize_text u_margin-top-med">
      <h1 class="visualize_header-h1 u_margin-top-med">Cannot Load Images!!!</h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import { SINGLE_IMAGE_QUERY } from '@/modules/gql/image-gql';
import { useReduce } from '@/composables/useReduce';
import Spinner from '@/components/Spinner.vue';

// Component name for debugging
defineOptions({
  name: 'ImageDetailView',
});

// Props
interface Props {
  id: string;
}

const props = defineProps<Props>();

// Route and router
const route = useRoute();
const router = useRouter();

// Composables
const { reduceDescription } = useReduce();

// Reactive data
const baseUrl = ref(window.location.origin);
const shareToolTip = ref('Share Image');
const error = ref({ status: false, message: null });
const getSingleImages = ref<any>({});
const tabbed_content = ref({
  ri_active: true,
  kw_active: true,
  md_active: false,
  au_active: true,
});
const showLink = ref(false);
const currentImage = ref<any>({});
const assetItems = ref<any[]>([]);
const pushedAssetItem = ref<any[]>([]);
const screen = ref(0);

// Computed properties
const hideAssetNavLeft = computed(() => {
  // This logic would need to be implemented based on the original component's behavior
  return false;
});

// GraphQL query
const { result, loading } = useQuery(
  SINGLE_IMAGE_QUERY,
  () => ({
    input: { id: route.params.id },
  }),
  () => ({
    fetchPolicy: 'cache-and-network',
  })
);

// Watch for query result changes
watch(result, (newResult) => {
  if (newResult?.getSingleImages) {
    getSingleImages.value = newResult.getSingleImages;
    setCurrentImage(newResult.getSingleImages);
  }
});

// Methods
const setCurrentImage = (newValues: any) => {
  const { images } = newValues;
  const [first] = images.filter((img: any) => img.file === route.params.fileId);
  currentImage.value = first;
  assetItems.value = images.filter((img: any) => img.file !== route.params.fileId);
};

const navBack = () => {
  router.back();
};

const nav_to_tab = (e: Event) => {
  const target = e.target as HTMLElement;
  const name = target.getAttribute('name');
  if (name) {
    Object.keys(tabbed_content.value).forEach((el) => {
      (tabbed_content.value as any)[el] = true;
    });
    (tabbed_content.value as any)[name] = false;
  }
};

const nav_to_doi = (doi: string) => {
  router.push(`/explorer/article/${doi}`);
};

const nav_to_keyword = (keyword: string) => {
  router.push(`/explorer/images?page=1&type=Keyword&q=${encodeURIComponent(keyword)}`);
};

const nav_to_doi_images = (doi: string) => {
  router.push(`/explorer/images?page=1&type=filterByDOI&q=${encodeURIComponent(doi)}`);
};

const updateCurrentImage = (fileId: string) => {
  const [first] = getSingleImages.value.images.filter((img: any) => img.file === fileId);
  currentImage.value = first;
};

const handleShare = (imgUrl: string) => {
  navigator.clipboard.writeText(imgUrl);
  shareToolTip.value = 'Link copied to clipboard';
  setTimeout(() => {
    shareToolTip.value = 'Share Image';
  }, 2000);
};

const reduceAsset = (direction: string) => {
  // This method would need to be implemented based on the original component's behavior
  console.log('reduceAsset called with direction:', direction);
};
</script>
