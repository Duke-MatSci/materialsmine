<template>
  <div class="md-layout section_referenceContainer">
    <div class="md-layout-item md-size-100" v-if="references.length">
      <h4 v-if="referenceOpen" @click="refOpen">References <i class="material-icons icon-adjust">keyboard_arrow_up</i></h4>
      <h4 v-else @click="refOpen">References <i class="material-icons icon-adjust">keyboard_arrow_down</i></h4>
    </div>
    <div class="md-layout-item md-size-100" v-if="referenceOpen">
      <p v-for="ref in referenceList" :key="ref.title" class="reference">{{ ref.authors }}, {{ ref.title }}, <i>{{ ref.venue }}</i>, {{ ref.date }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

defineOptions({
  name: 'ReferenceContainer',
});

interface Props {
  references: string[];
  openOnLoad?: boolean;
}

interface Reference {
  title: string;
  authors: string;
  venue: string;
  date: string;
}

const props = withDefaults(defineProps<Props>(), {
  openOnLoad: false
});

const store = useStore();
const referenceOpen = ref<boolean>(false);

// Computed
const referenceList = computed<Reference[]>(() => {
  return Array.from(props.references, (id: string) => store.getters.getReferenceById(id))
    .filter(Boolean) as Reference[]; // don't keep undefined or null references
});

// Methods
const refOpen = (): void => {
  referenceOpen.value = !referenceOpen.value;
};

// Lifecycle
onMounted(() => {
  referenceOpen.value = props.openOnLoad;
});
</script>
