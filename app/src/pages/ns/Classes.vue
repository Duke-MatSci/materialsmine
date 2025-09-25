<template>
  <article class="md-card-header u--margin-posmd md-layout md-alignment-center-center">
    <header
      aria-label="classes-header"
      class="md-layout-item md-size-90 md-medium-size-95 md-small-size-100 u_height--auto u_margin-bottom-med"
    >
      <h1 class="visualize_header-h1 article_title teams_header u_centralize_text">
        {{ pageTitle }}
      </h1>
      <p class="u--margin-neg md-subheading u--color-grey-sec u_centralize_text">
        <small>Last Updated:- {{ lastUpdate }}</small>
      </p>
    </header>
    <main
      aria-label="dynamfit-main"
      class="u--margin-posmd md-layout md-alignment-top-space-between md-layout-item md-size-90 md-medium-size-95 md-small-size-100 u_height--auto"
    >
      <!-- aside  -->
      <aside
        aria-label="dynamfit-setting"
        class="md-layout-item md-size-25 md-medium-size-35 md-small-size-100 md-xsmall-size-100 u_height--auto"
      >
        <ClassesList />
      </aside>
      <!-- main  -->
      <section
        aria-label="dynamfit-data"
        class="md-layout-item md-size-70 md-medium-size-60 md-small-size-100 md-xsmall-size-100 u_height--auto"
      >
        <div v-if="objLength" class="md-table md-card-header utility-bg_border-dark u--b-rad">
          <h3 class="md-body-1">Details</h3>

          <table class="u_width--max">
            <tbody>
              <tr class="" v-for="(val, key) in currentClass" :key="key">
                <template v-if="(key as unknown as string) !== 'subClasses'">
                  <td class="md-table-cell teams_partner-nsf image-detail-page-tab">
                    <div class="md-table-cell-container">
                      {{ key }}
                    </div>
                  </td>

                  <td class="md-table-cell image-detail-page-tab">
                    <div class="md-table-cell-container">
                      <template v-if="(key as unknown as string) !== 'subClassOf'">
                        {{ val }}
                      </template>
                      <router-link
                        :to="`/ns/${(val as unknown as string).split('/').pop()}`"
                        v-else
                      >
                        {{ (val as unknown as string).split('/').pop()?.split('#').pop() }}
                      </router-link>
                    </div>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>

          <div class="md-card-actions md-alignment-right">
            <button
              class="md-button btn btn--primary btn--noradius"
              @click.prevent="visualize(currentClass.ID)"
            >
              Visualize
            </button>
          </div>
        </div>
      </section>
    </main>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import ClassesList from '@/components/ns/classes/ClassesList.vue';

// Component name for debugging
defineOptions({
  name: 'Namespace',
});

const store = useStore();
const router = useRouter();

// Computed properties
const currentClass = computed(() => store.state.ns.currentClass);
const classes = computed(() => store.getters['ns/getClasses']);
const lastUpdate = computed(() => store.getters['ns/getLastUpdatedDate']);

const objLength = computed(() => {
  const obj = currentClass.value ? currentClass.value : {};
  return Object.keys(obj).length;
});

const pageTitle = computed(() => {
  return currentClass.value?.['Preferred Name'] ?? 'MaterialsMine Ontology';
});

// Methods
const visualize = (idUrl: string) => {
  const id = idUrl.split('/').pop()?.split('#').pop();
  const url = `/ns/visualize?class=${id}`;
  router.push(url);
};
</script>
