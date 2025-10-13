# useXmlOperation Composable

This composable replaces the `xmlOperation.js` mixin from Vue 2. It provides XML curation operations, GraphQL queries, and pagination with query parameter management.

## Migration from Mixin

### Before (Vue 2 with Mixin)

```vue
<script>
import xmlOperation from '@/mixins/xmlOperation';

export default {
  mixins: [xmlOperation],
  mounted() {
    // xmlFinder is automatically fetched via apollo option
    console.log(this.xmlFinder);
  },
  methods: {
    handleEdit(id, isNew) {
      this.editCuration(id, isNew);
    },
    handleDelete(id, isNew) {
      this.openDialogBox(id, isNew);
    }
  }
};
</script>

<template>
  <div v-for="xml in xmlFinder?.xmlData" :key="xml.id">
    <h3>{{ xml.title }}</h3>
    <button v-if="isOwner(xml.user)" @click="handleEdit(xml.id, xml.isNewCuration)">
      Edit
    </button>
    <button v-if="isOwner(xml.user)" @click="handleDelete(xml.id, xml.isNewCuration)">
      Delete
    </button>
  </div>

  <dialogBox :active="dialogBoxActive">
    <template v-slot:title>Confirm Delete</template>
    <template v-slot:content>
      Are you sure you want to delete this XML curation?
    </template>
    <template v-slot:actions>
      <button @click="closeDialogBox">Cancel</button>
      <button @click="confirmAction">Delete</button>
    </template>
  </dialogBox>
</template>
```

### After (Vue 3 with Composable)

```vue
<script setup lang="ts">
import { useXmlOperation } from '@/composables';
import dialogBox from '@/components/Dialog.vue';

const {
  // Data
  xmlFinder,
  xmlData,
  loading,
  error,
  dialogBoxActive,

  // Auth
  isAuth,
  isAdmin,
  isOwner,

  // Pagination (from useExplorerQueryParams)
  pageNumber,
  pageSize,
  searchWord,

  // Methods
  editCuration,
  openDialogBox,
  closeDialogBox,
  confirmAction,
  refetchXmlFinder
} = useXmlOperation();
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else v-for="xml in xmlData" :key="xml.id">
    <h3>{{ xml.title }}</h3>
    <button v-if="isOwner(xml.user)" @click="editCuration(xml.id, xml.isNewCuration)">
      Edit
    </button>
    <button v-if="isOwner(xml.user)" @click="openDialogBox(xml.id, xml.isNewCuration)">
      Delete
    </button>
  </div>

  <dialogBox :active="dialogBoxActive">
    <template v-slot:title>Confirm Delete</template>
    <template v-slot:content>
      Are you sure you want to delete this XML curation?
    </template>
    <template v-slot:actions>
      <button @click="closeDialogBox">Cancel</button>
      <button @click="confirmAction">Delete</button>
    </template>
  </dialogBox>
</template>
```

## API

### Parameters

The composable accepts an optional options object:

```typescript
interface XmlOperationOptions {
  autoFetch?: boolean;  // Auto-execute GraphQL query on mount (default: true)
}
```

### Return Values

```typescript
interface XmlOperationReturn {
  // Data
  xmlFinder: Ref<XmlFinderResult | null>;      // Full GraphQL result
  xmlData: Ref<XmlData[]>;                      // Array of XML data items
  error: Ref<string | null>;                    // Error message if any
  loading: Ref<boolean>;                        // Loading state
  dialogBoxActive: Ref<boolean>;                // Dialog box open state
  dialogBoxAction: Ref<(() => Promise<void>) | null>;  // Pending action

  // From useExplorerQueryParams
  pageNumber: Ref<number>;                      // Current page
  pageSize: Ref<number>;                        // Items per page
  searchWord: Ref<string>;                      // Search query
  searchEnabled: Ref<boolean>;                  // Search active state

  // Computed (from Vuex store)
  isAuth: Ref<boolean>;                         // User authenticated
  isAdmin: Ref<boolean>;                        // User is admin
  userId: Ref<string | null>;                   // Current user ID
  filterParams: Ref<Record<string, any>>;       // Current filters

  // Methods
  refetchXmlFinder: () => Promise<void>;        // Refetch GraphQL data
  isOwner: (xmlUser: string) => boolean;        // Check if user owns XML
  editCuration: (id: string, isNew: boolean) => void;  // Navigate to edit page
  confirmAction: () => void;                    // Execute pending dialog action
  openDialogBox: (id: string, isNew: boolean) => void;  // Open confirm dialog
  closeDialogBox: () => void;                   // Close dialog
  deleteXmlCuration: (id: string, isNew?: boolean | null) => Promise<void>;  // Delete XML
  updateFilterParams: () => Record<string, any> | false;  // Update filters
  toggleDialogBox: () => void;                  // Toggle dialog state

  // Query params methods (from useExplorerQueryParams)
  loadParams: (query: Record<string, any>) => Promise<void>;
  updateParamsAndCall: (pushNewRoute?: boolean) => Promise<void>;
  loadPrevNextImage: (event: number) => Promise<void>;
  updateSearchWord: (searchWord: string) => void;
  resetSearch: (type: string) => Promise<void>;
  checkPageSize: (pageSize: number) => void;
}
```

### XmlData Type

```typescript
interface XmlData {
  id: string;
  title: string;
  status: string;
  isNewCuration: boolean;
  sequence: string;
  user: string;
}
```

## Features

### 1. Automatic GraphQL Query
- ✅ Fetches XML curation data using Apollo GraphQL
- ✅ Automatically refetches on page/size changes
- ✅ Handles loading and error states
- ✅ Supports pagination and search
- ✅ Filters by route (Approved vs Not_Approved)

### 2. Pagination & Query Params
- ✅ Includes all `useExplorerQueryParams` functionality
- ✅ URL query parameter synchronization
- ✅ Page number and size management
- ✅ Search functionality

### 3. Authentication & Authorization
- ✅ `isAuth` - Check if user is authenticated
- ✅ `isAdmin` - Check if user is admin
- ✅ `isOwner()` - Check if user owns specific XML
- ✅ Auto-updates filters based on user

### 4. CRUD Operations
- ✅ Edit curation navigation
- ✅ Delete curation with confirmation
- ✅ Dialog box management
- ✅ Auto-refetch after operations

### 5. Error Handling
- ✅ Network error handling
- ✅ GraphQL error handling
- ✅ Snackbar notifications
- ✅ Error state management

## Examples

### Basic Usage

```vue
<script setup lang="ts">
import { useXmlOperation } from '@/composables';

const {
  xmlData,
  loading,
  error,
  pageNumber,
  pageSize
} = useXmlOperation();
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else>
    <div v-for="xml in xmlData" :key="xml.id">
      {{ xml.title }}
    </div>
    <p>Page {{ pageNumber }} of {{ Math.ceil(xmlFinder?.totalItems / pageSize) }}</p>
  </div>
</template>
```

### With Search and Pagination

```vue
<script setup lang="ts">
import { useXmlOperation } from '@/composables';

const {
  xmlData,
  loading,
  searchWord,
  updateSearchWord,
  pageNumber,
  loadPrevNextImage,
  xmlFinder
} = useXmlOperation();

const handleSearch = (query: string) => {
  updateSearchWord(query);
};

const goToPage = (page: number) => {
  loadPrevNextImage(page);
};
</script>

<template>
  <input
    :value="searchWord"
    @input="handleSearch($event.target.value)"
    placeholder="Search XML..."
  />

  <div v-for="xml in xmlData" :key="xml.id">
    {{ xml.title }}
  </div>

  <Pagination
    :current="pageNumber"
    :total="xmlFinder?.totalPages"
    @change="goToPage"
  />
</template>
```

### With Delete Confirmation

```vue
<script setup lang="ts">
import { useXmlOperation } from '@/composables';
import dialogBox from '@/components/Dialog.vue';

const {
  xmlData,
  isOwner,
  dialogBoxActive,
  openDialogBox,
  closeDialogBox,
  confirmAction
} = useXmlOperation();
</script>

<template>
  <div v-for="xml in xmlData" :key="xml.id">
    <h3>{{ xml.title }}</h3>
    <span>Status: {{ xml.status }}</span>

    <div v-if="isOwner(xml.user)" class="actions">
      <button @click="editCuration(xml.id, xml.isNewCuration)">
        Edit
      </button>
      <button @click="openDialogBox(xml.id, xml.isNewCuration)">
        Delete
      </button>
    </div>
  </div>

  <dialogBox :active="dialogBoxActive">
    <template v-slot:title>Confirm Deletion</template>
    <template v-slot:content>
      <p>Are you sure you want to delete this XML curation?</p>
      <p class="warning">This action cannot be undone.</p>
    </template>
    <template v-slot:actions>
      <button class="btn-secondary" @click="closeDialogBox">
        Cancel
      </button>
      <button class="btn-danger" @click="confirmAction">
        Delete
      </button>
    </template>
  </dialogBox>
</template>
```

### Manual Fetch Control

```vue
<script setup lang="ts">
import { useXmlOperation } from '@/composables';

// Disable auto-fetch, fetch manually instead
const {
  xmlData,
  loading,
  refetchXmlFinder
} = useXmlOperation({ autoFetch: false });

const loadData = async () => {
  await refetchXmlFinder();
};

// Trigger initial load when needed
onMounted(() => {
  loadData();
});
</script>
```

### Route-Based Filtering

The composable automatically filters based on route name:
- Route name `'ApprovedCuration'` → Shows only approved XML
- Other routes → Shows not approved XML

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useXmlOperation } from '@/composables';

const route = useRoute();
const { xmlData } = useXmlOperation();

// xmlData automatically filtered based on route.name
// No additional configuration needed
</script>

<template>
  <h2 v-if="route.name === 'ApprovedCuration'">
    Approved Curations
  </h2>
  <h2 v-else>
    Pending Curations
  </h2>

  <div v-for="xml in xmlData" :key="xml.id">
    {{ xml.title }} - {{ xml.status }}
  </div>
</template>
```

### With Filter Parameters

```vue
<script setup lang="ts">
import { useXmlOperation } from '@/composables';

const {
  xmlData,
  filterParams,
  updateFilterParams,
  refetchXmlFinder
} = useXmlOperation();

// Filters are automatically set based on authenticated user
// filterParams.value will contain { user: userId } if authenticated

const applyCustomFilter = async () => {
  updateFilterParams(); // Refresh filter params
  await refetchXmlFinder(); // Refetch with new filters
};
</script>
```

## Notes

- **Automatic Pagination**: The composable automatically watches route query changes for `page`, `size`, and `q` parameters
- **Auto-Refetch**: Changes to `pageNumber` or `pageSize` automatically trigger a refetch
- **Error Handling**: Errors are automatically displayed via snackbar notifications
- **User Filtering**: When authenticated, results are automatically filtered by the current user
- **Status Filtering**: Route name determines status filter (Approved vs Not_Approved)
- **Dialog State**: Dialog box state is managed through Vuex store
- **Type Safety**: Full TypeScript support for all data types and methods

## Integration with useExplorerQueryParams

This composable internally uses `useExplorerQueryParams`, so you get all pagination and search functionality automatically without needing to use both composables separately.

```typescript
// ❌ Don't do this (redundant)
const xmlOps = useXmlOperation();
const queryParams = useExplorerQueryParams({ localSearchMethod: ... });

// ✅ Do this (all-in-one)
const xmlOps = useXmlOperation();
// Already includes pageNumber, pageSize, searchWord, etc.
```

## Dependencies

- `@vue/apollo-composable` - For GraphQL queries
- `vue-router` - For routing and navigation
- `vuex` - For state management (auth, dialog box)
- `@/modules/gql/xml-gql` - GraphQL query definitions
- `useExplorerQueryParams` - Query parameter management (internal)
