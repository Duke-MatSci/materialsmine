<template>
  <div class="explorer_page-nav u_margin-top-med viz-pagination-width-mod u_margin-bottom-small">
    <div v-if="tpages > 1">
      <button
        @click.prevent="goToBeginning"
        v-if="rowNumber > 1" :disabled="rowNumber < 1"
        class="md-button md-icon-button md-dense md-primary u--color-primary">1 </button>
      <button
        @click.prevent="prevRow" v-if="rowNumber > 1"
        class="md-button md-icon-button md-dense md-primary u--color-primary">
        <md-icon class="u--default-size">more_horiz</md-icon>
      </button>
      <button
        @click.prevent="goToPage(n + offset)" v-for="(n, i) in lengths" :key="i"
        class="md-button md-icon-button md-dense md-primary"
        :class="isActiveClass(n + offset)"
      >{{ n + offset }}</button>
      <button @click.prevent="nextRow" class="md-button md-icon-button md-dense md-primary u--color-primary" v-if="rowNumber < factor">
        <md-icon class="u--default-size">more_horiz</md-icon>
      </button>
      <button @click.prevent="goToEnd" v-if="rowNumber < factor" class="md-button md-icon-button md-dense md-primary u--color-primary"> {{ tpages }} </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

// Component name for debugging
defineOptions({
  name: 'Pagination'
});

// Props
interface Props {
  cpage: number;
  tpages: number;
}

const props = defineProps<Props>();

// Emits
interface Emits {
  (e: 'go-to-page', page: number): void;
}

const emit = defineEmits<Emits>();

// Data
const pageInput = ref<number>(props.cpage);
const offset = ref<number>(0);
const rowNumber = ref<number>(1);

// Computed
const factor = computed(() => {
  return Math.ceil(props.tpages / lengths.value);
});

const lengths = computed(() => {
  if (window.matchMedia('(max-width: 27.5em)').matches) {
    if (props.tpages <= 4) {
      return props.tpages;
    }
    return 3;
  } else {
    if (props.tpages <= 7) {
      return props.tpages;
    }
    return 5;
  }
});

// Methods
const pageExists = (page: number): boolean => {
  return page > 0 && page <= props.tpages;
};

const isActiveClass = (e: number): string => {
  return e === pageInput.value ? 'btn--primary' : 'u--color-primary';
};

const verifyRow = (): void => {
  if (props.cpage === 1) return;
  const limit = factor.value - 1;
  const rowNum = Math.ceil(props.cpage / lengths.value);
  if (props.cpage < props.tpages && rowNum <= limit) {
    offset.value = (rowNum - 1) * lengths.value;
    rowNumber.value = rowNum;
  } else {
    goToLastRow();
  }
};

const goToBeginning = (): void => {
  rowNumber.value = 1;
  offset.value = 0;
  goToPage(1);
};

const goToLastRow = (): void => {
  offset.value = props.tpages - lengths.value;
  rowNumber.value = factor.value;
};

const goToEnd = (): void => {
  goToLastRow();
  goToPage(props.tpages);
};

const goToPage = (page: number): void => {
  if ((page !== props.cpage) && pageExists(page)) {
    emit('go-to-page', page);
    pageInput.value = page;
  }
};

const nextRow = (): void => {
  if (rowNumber.value === factor.value) return;
  const limit = factor.value - 1;
  if (rowNumber.value < limit) {
    offset.value += lengths.value;
    rowNumber.value += 1;
  } else {
    goToLastRow();
  }
};

const prevRow = (): void => {
  if (rowNumber.value === 1) return;
  if (rowNumber.value === factor.value) {
    const elem = factor.value;
    offset.value = (elem - 2) * lengths.value;
    rowNumber.value -= 1;
  } else {
    offset.value -= lengths.value;
    rowNumber.value -= 1;
  }
};

// Watch
// Necessary for when searching changes the page number
watch(() => props.cpage, (newValue, oldValue) => {
  if ((newValue !== oldValue) && pageExists(newValue)) {
    pageInput.value = newValue;
    verifyRow();
  }
});

// Lifecycle
onMounted(() => {
  if (pageExists(props.cpage)) {
    verifyRow();
  } else {
    goToEnd();
  }
});
</script>
