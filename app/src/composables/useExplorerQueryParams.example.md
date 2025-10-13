# useExplorerQueryParams Composable

This composable replaces the `explorerQueryParams.js` mixin from Vue 2.

## Migration from Mixin

### Before (Vue 2 with Mixin)

```vue
<script>
import explorerQueryParams from '@/mixins/explorerQueryParams';

export default {
  mixins: [explorerQueryParams],
  data() {
    return {
      pageNumber: 1,
      pageSize: 20,
      searchWord: '',
      searchEnabled: false,
      filter: '',
      filtersActive: false,
      renderText: ''
    };
  },
  methods: {
    async localSearchMethod() {
      // Your search logic here
    }
  }
};
</script>
```

### After (Vue 3 with Composable)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useExplorerQueryParams } from '@/composables';

const filter = ref('');
const filtersActive = ref(false);
const renderText = ref('');

const localSearchMethod = async () => {
  // Your search logic here
  console.log('Searching with:', {
    pageNumber: pageNumber.value,
    pageSize: pageSize.value,
    searchWord: searchWord.value
  });
};

const {
  pageNumber,
  pageSize,
  searchWord,
  searchEnabled,
  loadParams,
  updateParamsAndCall,
  loadPrevNextImage,
  updateSearchWord,
  resetSearch,
  checkPageSize
} = useExplorerQueryParams({
  localSearchMethod,
  hasPageSize: true, // optional, defaults to true
  filter, // optional
  filtersActive, // optional
  renderText // optional
});
</script>
```

## API

### Parameters

The composable accepts an options object with the following properties:

```typescript
interface ExplorerQueryParamsOptions {
  localSearchMethod: () => Promise<void>;  // Required: callback for search
  hasPageSize?: boolean;                    // Optional: enable page size (default: true)
  filtersActive?: Ref<boolean>;            // Optional: ref for filters active state
  filter?: Ref<string>;                     // Optional: ref for filter type
  renderText?: Ref<string>;                 // Optional: ref for render text
}
```

### Return Values

```typescript
interface ExplorerQueryParamsReturn {
  pageNumber: Ref<number>;                  // Current page number
  pageSize: Ref<number>;                    // Items per page
  searchWord: Ref<string>;                  // Search query string
  searchEnabled: Ref<boolean>;              // Whether search is active
  loadParams: (query) => Promise<void>;     // Load params from query object
  updateParamsAndCall: (pushNewRoute?) => Promise<void>;  // Update params and trigger search
  loadPrevNextImage: (event) => Promise<void>;  // Navigate to page number
  updateSearchWord: (searchWord) => void;   // Update search word
  resetSearch: (type) => Promise<void>;     // Reset search and clear query params
  checkPageSize: (pageSize) => void;        // Validate and set page size (1-50)
}
```

## Features

- ✅ Automatic route query parameter synchronization
- ✅ Page number management with validation
- ✅ Page size management (1-50 range, defaults to 20)
- ✅ Search word management
- ✅ Search enabled state tracking
- ✅ Optional filter support
- ✅ Automatic watchers for route and pageSize changes
- ✅ Full TypeScript support

## Examples

### Basic Usage (Pagination Only)

```vue
<script setup lang="ts">
import { useExplorerQueryParams } from '@/composables';

const localSearchMethod = async () => {
  // Fetch data with current page
  await fetchData(pageNumber.value, pageSize.value);
};

const { pageNumber, pageSize, loadPrevNextImage } = useExplorerQueryParams({
  localSearchMethod,
  hasPageSize: true
});
</script>

<template>
  <Pagination
    :page="pageNumber"
    :pageSize="pageSize"
    @update:page="loadPrevNextImage"
  />
</template>
```

### With Search

```vue
<script setup lang="ts">
import { useExplorerQueryParams } from '@/composables';

const localSearchMethod = async () => {
  const results = await searchAPI({
    query: searchWord.value,
    page: pageNumber.value,
    size: pageSize.value
  });
  // Handle results
};

const {
  pageNumber,
  pageSize,
  searchWord,
  searchEnabled,
  updateSearchWord,
  resetSearch
} = useExplorerQueryParams({
  localSearchMethod
});
</script>

<template>
  <input
    :value="searchWord"
    @input="updateSearchWord($event.target.value)"
    placeholder="Search..."
  />
  <button v-if="searchEnabled" @click="resetSearch('items')">
    Clear Search
  </button>
</template>
```

### With Filters

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useExplorerQueryParams } from '@/composables';

const filter = ref('all');
const filtersActive = ref(false);

const localSearchMethod = async () => {
  const results = await searchAPI({
    query: searchWord.value,
    filter: filter.value,
    page: pageNumber.value
  });
  // Handle results
};

const { searchWord, updateSearchWord } = useExplorerQueryParams({
  localSearchMethod,
  filter,
  filtersActive
});
</script>
```

## Notes

- The composable automatically watches route query changes and updates state
- The composable automatically watches pageSize changes and triggers search
- Page size is constrained to 1-50 range (defaults to 20 if out of range)
- Query parameters: `page`, `size`, `q` (search), `type` (filter)
- All methods are async where appropriate
- Full TypeScript type safety included
