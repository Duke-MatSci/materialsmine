<template>
  <div class="image-detail-page">
    <div class="section_loader" v-if="loading">
      <spinner :loading="loading" text="Loading Dataset" />
    </div>
    <div class="utility-roverflow" v-else-if="dataset">
      <div class="utility-content__result teams_partner">
        <div class="utility-space search_box_form u--layout-flex-justify-end">
          <md-button id="navbackBtn" class="md-icon-button" @click.prevent="navBack">
            <md-tooltip> Go Back </md-tooltip>
            <md-icon>arrow_back</md-icon>
          </md-button>
          <md-button id="shareChartBtn" class="md-icon-button" @click.prevent="handleShare">
            <md-tooltip> {{ shareToolTip }} </md-tooltip>
            <md-icon>share</md-icon>
          </md-button>
          <!-- <div v-if="isAuth && isAdmin">
            <md-button class="md-icon-button" @click.prevent="editDataset">
              <md-tooltip> Edit Dataset </md-tooltip>
              <md-icon>edit</md-icon>
            </md-button>
          </div>
          <div v-if="isAuth && isAdmin">
            <md-button class="md-icon-button" @click.prevent="linkDataset">
              <md-tooltip> Link to SDD </md-tooltip>
              <md-icon>link</md-icon>
            </md-button>
          </div> -->
        </div>
      </div>

      <md-card md-theme="green-card" class="md-primary u--shadow-none u--padding-zero-mobile">
        <md-card-header class="section_md-header">
          <md-card-header-text class="section_text-col flex-item">
            <div v-if="dataset && dataset.label" class="md-title u--margin-header">
              {{ optionalChaining(() => dataset.label) || 'Curated Dataset' }}
            </div>
            <div v-if="dataset && dataset.doi">
              DOI: <span class="u--b-rad">{{ doi }}</span>
            </div>
            <div v-if="dataset && dataset.description">
              {{ dataset.description }}
            </div>
          </md-card-header-text>
          <div
            v-if="dataset && dataset.thumbnail"
            class="quicklinks_content flex-item u--padding-zero"
            style="max-width: 20rem"
          >
            <img
              v-if="thumbnail"
              :src="optionalChaining(() => thumbnail)"
              :alt="`${optionalChaining(() => dataset.label)} image` || 'Dataset Thumbnail'"
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
          name="ds_active"
          :class="{
            'u--margin-rightmd': true,
            'section_tabb-controller': !tabbed_content.ds_active,
            u_pointer: true,
            'u--padding-rl-xs': true,
          }"
        >
          Distributions
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
        <!-- <div
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
        </div> -->
      </div>

      <div>
        <div
          id="distributions"
          :class="{
            search_box_form: true,
            'u--layout-flex-justify-se': true,
            explorer_page_header: true,
            'u--layout-flex-switch': tabbed_content.ds_active,
          }"
        >
          <div class="search_box_form howto_item-header">
            <md-button
              :class="{
                'md-icon-button': true,
                'u--layout-hide': hideAssetNavLeft,
              }"
              @click.prevent="reduceAsset('prev')"
            >
              <md-tooltip> Show Left </md-tooltip>
              <md-icon>arrow_back</md-icon>
            </md-button>

            <div class="section_md-header u_display-flex image-detail-page__relatedImg">
              <md-card
                v-for="(item, index) in distributions"
                class="md-card-class u--margin-none"
                :class="`charts-${index + 1} charts-${index + 1}-narrow`"
                :key="`card_${index}`"
              >
                <a :href="optionalChaining(() => item.downloadLink)">
                  <md-card-media-cover md-solid>
                    <md-card-media md-ratio="4:3">
                      <md-icon class="explorer_page-nav-card_icon u_margin-top-small"
                        >description</md-icon
                      >
                    </md-card-media>

                    <md-card-area class="u_gridbg">
                      <md-card-header class="u_show_hide">
                        <span class="md-subheading">
                          <strong>{{
                            optionalChaining(() => item.label) || 'Dataset File'
                          }}</strong>
                        </span>
                        <span class="md-body-1">Click to download</span>
                      </md-card-header>
                    </md-card-area>
                  </md-card-media-cover>
                </a>
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
          v-if="dataset"
          id="metadata"
          :class="{
            search_box_form: false,
            'u--layout-flex-justify-se': true,
            explorer_page_header: true,
            'u--layout-flex-switch': tabbed_content.md_active,
            metadata: true,
          }"
        >
          <div class="u--margin-pos" v-if="!!organizations.length">
            <span class="u--font-emph-xl u--color-black">
              Associated Organizations/Institutions:
            </span>
            <span
              v-for="(org, index) in organizations"
              :key="`org_${index}`"
              class="u--color-grey-sec"
            >
              <a v-if="index == 0" :href="optionalChaining(() => org[0].id)" target="_blank">
                {{ optionalChaining(() => org[0].name) }}
              </a>
              <a v-else :href="optionalChaining(() => org[0].id)" target="_blank">
                , {{ optionalChaining(() => org[0].name) }}
              </a>
            </span>
          </div>
          <div class="u--margin-pos" v-if="dataset[datasetFields['datePub']]">
            <span class="u--font-emph-xl u--color-black"> Date Published: </span>
            <span class="u--font-emph-xl u--color-grey-sec">
              {{ optionalChaining(() => dataset[datasetFields['datePub']][0]['@value']) || 'N/A' }}
            </span>
          </div>
          <div v-else-if="!organizations.length">
            <span class="u--font-emph-xl u--color-grey-sec"> N/A </span>
          </div>
        </div>

        <!-- <div
          v-if="dataset"
          id="authors"
          :class="{
            search_box_form: true,
            'u--layout-flex-justify-se': false,
            explorer_page_header: true,
            'u--layout-flex-switch': tabbed_content.au_active,
          }"
        >
          <div class="u--margin-pos" v-if="orcidData">
            <span class="u--font-emph-xl u--color-black"> Contact Point: </span>
            <span id="microscropy" class="u--font-emph-xl u--color-grey-sec">
              {{
                optionalChaining(() => orcidData['http://schema.org/givenName'][0]['@value']) || ''
              }}
              {{
                optionalChaining(() => orcidData['http://schema.org/familyName'][0]['@value']) || ''
              }}
            </span>
            <div>
              ORCiD:
              <a class="u--b-rad" :href="optionalChaining(() => orcidData['@id'])" target="_blank">
                {{
                  optionalChaining(() => orcidData['@id']) ||
                  optionalChaining(() => dataset[datasetFields.cp][0]['@id']) ||
                  'N/A'
                }}
              </a>
            </div>
            <div v-if="orcidData['http://www.w3.org/2006/vcard/ns#email']">
              Contact Email:
              {{
                optionalChaining(
                  () => orcidData['http://www.w3.org/2006/vcard/ns#email'][0]['@value']
                ) || 'N/A'
              }}
            </div>
          </div>
          <div class="u--margin-pos" v-else>
            <span class="u--font-emph-xl u--color-grey-sec"> N/A </span>
          </div>
        </div> -->
      </div>
    </div>
    <div v-else class="utility-roverflow u_centralize_text u_margin-top-med">
      <h1 class="visualize_header-h1 u_margin-top-med">Cannot Load Dataset</h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import spinner from '@/components/Spinner.vue';
import { parseFileName } from '@/modules/whyis-dataset';

defineOptions({
  name: 'DatasetDetailView',
});

interface Props {
  id: string;
}

interface TabbedContent {
  ds_active: boolean;
  md_active: boolean;
  au_active: boolean;
}

interface DatasetFields {
  description: string;
  doi: string;
  datePub: string;
  title: string;
  cp: string;
  distribution: string;
  depiction: string;
  organization: string;
}

interface Distribution {
  downloadLink?: string;
  label?: string;
}

interface RorOrganization {
  id?: string;
  name?: string;
}

const props = defineProps<Props>();

const store = useStore();
const router = useRouter();

// Data from reducer mixin
const hideAssetNavLeft = ref<boolean>(false);
const hideAssetNavRight = ref<boolean>(false);
const screen = ref<number>(0);
const assetItems = ref<any[]>([]);
const pushedAssetItem = ref<any[]>([]);

// Component data
const shareToolTip = ref<string>('Share Dataset');
const tabbed_content = reactive<TabbedContent>({
  ds_active: false,
  md_active: true,
  au_active: true,
});

const datasetFields = reactive<DatasetFields>({
  description: 'http://purl.org/dc/terms/description',
  doi: 'http://purl.org/dc/terms/isReferencedBy',
  datePub: 'http://purl.org/dc/terms/issued',
  title: 'http://purl.org/dc/terms/title',
  cp: 'http://www.w3.org/ns/dcat#contactpoint',
  distribution: 'http://www.w3.org/ns/dcat#distribution',
  depiction: 'http://xmlns.com/foaf/0.1/depiction',
  organization: 'http://xmlns.com/foaf/0.1/Organization',
});

const distributions = ref<Record<string, Distribution>>({});
const organizations = ref<RorOrganization[][]>([]);
const loading = ref<boolean>(true);

// Computed properties
// const dialogBoxActive = computed(() => store.getters.dialogBox);
// const isAuth = computed(() => store.getters['auth/isAuthenticated']);
// const isAdmin = computed(() => store.getters['auth/isAdmin']);
// const rorData = computed(() => store.getters['explorer/curation/getRorData']);
const dataset = computed(() => store.getters['explorer/getCurrentDataset']);
const thumbnail = computed(() => store.getters['explorer/getDatasetThumbnail']);
const orcidData = computed(() => store.getters['explorer/curation/getOrcidData']);
const routeInfo = computed(() => store.getters.getRouteInfo);

const doi = computed(() => {
  if (dataset.value?.doi) {
    const doiString = dataset.value.doi;
    return doiString.replace('http://dx.doi.org/', '');
  }
  return '';
});

const fullDatasetUri = computed(() => {
  return `${window.location.origin}/explorer/dataset/${props.id}`;
});

// Methods from optional-chaining-util mixin
const optionalChaining = <T,>(fn: () => T): T | undefined => {
  try {
    return fn();
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

const reduceAsset = (args: 'prev' | 'next'): boolean | void => {
  let movedAsset: any;

  if (window.matchMedia('(max-width: 40.5em)').matches) {
    screen.value = 1;
  } else if (window.matchMedia('(max-width: 56.25em)').matches) {
    screen.value = 2;
  } else {
    screen.value = 3;
  }

  if (args === 'prev') {
    if (!pushedAssetItem.value.length) {
      hideAssetNavLeft.value = true;
      return false;
    } else {
      hideAssetNavLeft.value = false;
      movedAsset = pushedAssetItem.value[pushedAssetItem.value.length - 1];
      assetItems.value.unshift(movedAsset);
      pushedAssetItem.value.pop();
    }
  } else {
    if (!assetItems.value.length) {
      hideAssetNavRight.value = true;
      return false;
    } else if (assetItems.value.length <= screen.value) {
      hideAssetNavRight.value = true;
      return false;
    } else {
      hideAssetNavRight.value = false;
      movedAsset = assetItems.value[0];
      pushedAssetItem.value.push(movedAsset);
      assetItems.value.shift();
    }
  }
};

// Component methods
const loadDataset = async (): Promise<void> => {
  try {
    await store.dispatch('explorer/fetchSingleDataset', fullDatasetUri.value);
  } catch (e) {
    store.commit('setSnackbar', { message: e });
    loading.value = false;
  }
};

const navBack = (): void => {
  // Note: A check to go back to gallery after curating a dataset
  const { from } = routeInfo.value;
  if (from.name === 'CurateSDD') {
    router.push('/explorer/curate');
  } else {
    router.back();
  }
};

const nav_to_tab = (e: Event): void => {
  Object.keys(tabbed_content).forEach((el) => {
    (tabbed_content as any)[el] = true;
  });
  const target = e.target as HTMLElement;
  const name = target.getAttribute('name');
  if (name) {
    (tabbed_content as any)[name] = false;
  }
};

const nav_to_doi = (doi: string): void => {
  router.push(`/explorer/article/${doi}`);
};

const handleShare = (): void => {
  navigator.clipboard.writeText(fullDatasetUri.value);
  shareToolTip.value = 'Link copied to clipboard';
  setTimeout(() => {
    shareToolTip.value = 'Share Dataset';
  }, 2000);
};

// const editDataset = (): void => {
//   router.push(`/explorer/curate/sdd/edit/${props.id}`);
// };

// const linkDataset = (): void => {
//   router.push(`/explorer/curate/sdd/link/${props.id}`);
// };

// Watchers
watch(dataset, (newValues, oldValues) => {
  loading.value = false;
  if (!newValues) return;

  if (newValues?.organization) {
    organizations.value = newValues?.organization?.map((name: string, id: number) => ({
      name,
      id,
    }));
  }

  if (newValues?.thumbnail) {
    store.dispatch('explorer/fetchDatasetThumbnail', newValues?.thumbnail);
  }

  if (newValues?.distribution) {
    for (const index in newValues.distribution) {
      const downloadLink = newValues.distribution[index];
      distributions.value[index] = {
        downloadLink,
        label: parseFileName(downloadLink),
      };
    }
  }
});

// Lifecycle
onMounted(() => {
  loading.value = true;
  loadDataset();
});
</script>
