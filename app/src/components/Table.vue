<template>
  <div class="table-wrapper">
    <div v-if="enableSearch" class="table-search">
      <input
        v-model="internalSearch"
        type="text"
        :placeholder="searchPlaceholder"
        @input="$emit('update:search', internalSearch)"
      />
    </div>

    <div class="table-main">
      <div class="table-row table-header">
        <div
          v-for="(header, index) in headers"
          :key="header.key"
          class="table-cell table-header-cell"
          @click="toggleSort(header.key)"
        >
          <template v-if="sortKey === header.key">
            <span class="header-label">{{ header.label }}</span>
            <span class="material-icons table-sort-icon" :class="index === 0 ? 'right' : 'left'">
              {{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
            </span>
          </template>
          <template v-else>
            {{ header.label }}
          </template>
        </div>
      </div>

      <div class="table-body">
        <template v-if="paginatedRows.length > 0">
          <div
            v-for="(row, rowIndex) in paginatedRows"
            :key="rowIndex"
            class="table-row table-body-row"
          >
            <div v-for="header in headers" :key="header.key" class="table-cell">
              {{ row[header.key] }}
            </div>
          </div>
        </template>

        <div v-else class="table-no-results">
          {{ noResultsText }}
        </div>
      </div>
    </div>

    <div v-if="enablePagination" class="table-pagination">
      <div class="table-rows-per-page table-rows">
        <div class="table-text-info">Rows per page:</div>
        <select v-model.number="rowsPerPage">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
        </select>
      </div>

      <div class="table-text-info">{{ startRow }}–{{ endRow }} of {{ rows.length }}</div>

      <div class="page-controls">
        <button class="table-button" @click="prevPage" :disabled="currentPage === 1">
          <span class="material-icons">keyboard_arrow_left</span>
        </button>
        <button class="table-button" @click="nextPage" :disabled="currentPage === totalPages">
          <span class="material-icons">keyboard_arrow_right</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Header {
  key: string;
  label: string;
}

const props = defineProps<{
  headers: Header[];
  rows: Record<string, any>[];
  enableSearch?: boolean;
  enablePagination?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
}>();

defineEmits(['update:search']);
const internalSearch = ref('');
const sortKey = ref<string | null>(null);
const sortOrder = ref<'asc' | 'desc' | null>(null);
function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value =
      sortOrder.value === 'asc' ? 'desc' : sortOrder.value === 'desc' ? 'asc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
}
onMounted(() => {
  if (props.headers.length > 0) {
    sortKey.value = props.headers[0].key;
    sortOrder.value = 'asc';
  }
});
const sortedRows = computed(() => {
  if (!sortKey.value || !sortOrder.value) return props.rows;
  return [...props.rows].sort((a, b) => {
    const key = sortKey.value;
    const valA = key ? a[key] : undefined;
    const valB = key ? b[key] : undefined;
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortOrder.value === 'asc' ? valA - valB : valB - valA;
    }
    return sortOrder.value === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });
});
const currentPage = ref(1);
const rowsPerPage = ref(5);
const totalPages = computed(() => Math.ceil(sortedRows.value.length / rowsPerPage.value));
const paginatedRows = computed(() => {
  if (!props.enablePagination) return sortedRows.value;
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedRows.value.slice(start, start + rowsPerPage.value);
});
function prevPage() {
  if (currentPage.value > 1) currentPage.value--;
}
function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++;
}
const startRow = computed(() =>
  props.enablePagination ? (currentPage.value - 1) * rowsPerPage.value + 1 : 1
);
const endRow = computed(() =>
  props.enablePagination
    ? Math.min(currentPage.value * rowsPerPage.value, sortedRows.value.length)
    : sortedRows.value.length
);
</script>

<style scoped lang="scss">
$primary: #08233c;
.table {
  &-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    font-size: 1.4rem;
  }

  &-search {
    align-self: flex-end;
    display: flex;
    gap: 1rem;
    align-items: end;

    select,
    input {
      padding: 0.4rem;
      width: 24rem;
      border: none;
      border-bottom: 1px solid #ccc;
      outline: none;
      background: transparent;
      transition: border-color 0.5s;
    }
    select:focus,
    input:focus {
      border-color: $primary;
    }
  }

  &-main {
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &-header {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    color: #0000008a;
    font-weight: bold;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  &-body {
    max-height: 400px;
    overflow-y: auto;
  }

  &-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    border-bottom: 1px solid #eee;
  }

  &-body-row {
    &:hover {
      background-color: #f1f1f1;
    }
  }

  &-cell {
    padding: 1.4rem 0.6rem;
    display: flex;
    align-items: center;
  }

  &-header-cell {
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 1rem;

    .header-label {
      order: 1;
    }
  }

  &-sort-icon {
    font-size: 1.6rem;

    &.right {
      order: 2; // icon appears AFTER label
    }

    &.left {
      order: 0; // icon appears BEFORE label
    }
  }

  &-pagination {
    align-self: flex-end;
    display: flex;
    gap: 4rem;
    align-items: center;
    font-size: 0.85rem;
  }

  &-rows-per-page select {
    margin-left: 0.3rem;
    padding: 0.2rem;
    border: none;
    outline: none;
    background: transparent;
  }

  &-rows {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  &-text-info {
    font-size: 1.4rem;
  }

  &-button {
    background: none;
    border: none;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    color: #000000a4;
    cursor: pointer;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &-no-results {
    text-align: center;
    padding: 2rem;
    color: #999;
    font-size: 2.4rem;
    font-weight: bold;
    font-style: italic;
  }
}
</style>
