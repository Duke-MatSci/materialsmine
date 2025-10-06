<template>
  <section class="u_width--max">
    <Table
      :headers="headers"
      :rows="paginatedData"
      :noResultsText="emptyState"
      :enableSearch="false"
      :enablePagination="false"
    />
    <Pagination
      v-if="paginate && totalPages > 1"
      :cpage="currentPage"
      :tpages="totalPages || 1"
      @go-to-page="paginateTable($event)"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Pagination from '@/components/explorer/Pagination.vue';
import Table from '@/components/Table.vue';

interface Props {
  tableData?: Record<string, unknown>[];
  paginate?: boolean;
  pageSize?: number;
  emptyState?: string;
  sortBy?: string;
}

const props = withDefaults(defineProps<Props>(), {
  tableData: () => [],
  paginate: true,
  pageSize: 7,
  emptyState: 'No Viscoelastic Data Uploaded',
  sortBy: '',
});

// Reactive state
const paginatedData = ref<Record<string, unknown>[]>([]);
const currentPage = ref(1);
const currentSort = ref('');
const currentSortOrder = ref<'asc' | 'desc'>('asc');

// Computed properties
const headers = computed(() => {
  const data = props.tableData ?? [];
  if (data.length === 0) return [];

  const firstItem = data[0];
  return Object.keys(firstItem).map((key) => ({
    key,
    label: key,
  }));
});

const totalPages = computed(() => {
  const total = props.tableData?.length ?? 0;
  return Math.ceil(total / props.pageSize);
});

const sortedData = computed(() => {
  const data = [...(props.tableData ?? [])];
  if (!currentSort.value) return data;

  return data.sort((a, b) => {
    const valA = a[currentSort.value];
    const valB = b[currentSort.value];

    // Numeric comparison
    if (typeof valA === 'number' && typeof valB === 'number') {
      const result = valA - valB;
      return currentSortOrder.value === 'asc' ? result : -result;
    }

    // String comparison
    const result = String(valA).localeCompare(String(valB));
    return currentSortOrder.value === 'asc' ? result : -result;
  });
});

// Methods
const paginateTable = (page: number = currentPage.value): void => {
  const data = sortedData.value;
  if (data.length <= props.pageSize) {
    paginatedData.value = data;
    return;
  }

  const end = props.pageSize * page;
  const start = props.pageSize * (page - 1);
  paginatedData.value = data.slice(start, end);
  currentPage.value = page;
};

const setTable = (): void => {
  if (!props.paginate) {
    paginatedData.value = sortedData.value;
    return;
  }
  paginateTable();
};

// Watchers
watch(
  () => props.tableData,
  () => {
    setTable();
  },
  { deep: true }
);

watch(
  () => [currentSort.value, currentSortOrder.value],
  () => {
    setTable();
  }
);

// Lifecycle hooks
onMounted(() => {
  setTable();
  currentSort.value = props.sortBy || '';
});
</script>
