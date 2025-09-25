# Vue 3 Composables Migration Guide

This directory contains Vue 3 composables that replace the Vue 2 mixins from the original application. These composables provide the same functionality but are designed to work with Vue 3's Composition API.

## Migration Overview

### Vue 2 Mixins → Vue 3 Composables

| Vue 2 Mixin                 | Vue 3 Composable           | Description                                       |
| --------------------------- | -------------------------- | ------------------------------------------------- |
| `optional-chaining-util.js` | `useOptionalChaining()`    | Safe function execution with error handling       |
| `reduce.js`                 | `useReduce()`              | Text reduction and asset navigation utilities     |
| `explorerQueryParams.js`    | `useExplorerQueryParams()` | URL query parameter management for explorer pages |
| `explorerSearch.js`         | `useExplorerSearch()`      | Search functionality for explorer components      |
| `deployVersion.js`          | `useDeployVersion()`       | Deployment version management                     |
| `xmlOperation.js`           | `useXmlOperation()`        | XML curation operations and GraphQL queries       |

## Usage Examples

### 1. useOptionalChaining

**Vue 2 (Mixin):**

```javascript
export default {
  mixins: [optionalChainingUtil],
  methods: {
    someMethod() {
      this.optionalChaining(() => someRiskyOperation());
    },
  },
};
```

**Vue 3 (Composable):**

```typescript
import { useOptionalChaining } from '@/composables';

export default {
  setup() {
    const { optionalChaining } = useOptionalChaining();

    const someMethod = () => {
      optionalChaining(() => someRiskyOperation());
    };

    return { someMethod };
  },
};
```

### 2. useReduce

**Vue 2 (Mixin):**

```javascript
export default {
  mixins: [reducer],
  methods: {
    formatText() {
      return this.reduceDescription('Some long text', 50);
    },
  },
};
```

**Vue 3 (Composable):**

```typescript
import { useReduce } from '@/composables';

export default {
  setup() {
    const { reduceDescription } = useReduce();

    const formatText = () => {
      return reduceDescription('Some long text', 50);
    };

    return { formatText };
  },
};
```

### 3. useExplorerQueryParams

**Vue 2 (Mixin):**

```javascript
export default {
  mixins: [explorerQueryParams],
  methods: {
    async loadData() {
      await this.loadParams(this.$route.query);
    },
  },
};
```

**Vue 3 (Composable):**

```typescript
import { useExplorerQueryParams } from '@/composables';

export default {
  setup() {
    const { loadParams, pageNumber, pageSize, searchWord } = useExplorerQueryParams();

    const loadData = async () => {
      await loadParams(route.query);
    };

    return {
      loadData,
      pageNumber,
      pageSize,
      searchWord,
    };
  },
};
```

### 4. useExplorerSearch

**Vue 2 (Mixin):**

```javascript
export default {
  mixins: [explorerSearch],
  methods: {
    search() {
      this.submitSearch('search term');
    },
  },
};
```

**Vue 3 (Composable):**

```typescript
import { useExplorerSearch } from '@/composables';

export default {
  setup() {
    const { submitSearch, searchWord, searchEnabled } = useExplorerSearch();

    const search = () => {
      submitSearch('search term');
    };

    return {
      search,
      searchWord,
      searchEnabled,
    };
  },
};
```

### 5. useDeployVersion

**Vue 2 (Mixin):**

```javascript
export default {
  mixins: [deployVersion],
  methods: {
    deploy() {
      this.deploy();
    },
  },
};
```

**Vue 3 (Composable):**

```typescript
import { useDeployVersion } from '@/composables';

export default {
  setup() {
    const { deploy, isProduction, currentVersion, isLoading } = useDeployVersion();

    return {
      deploy,
      isProduction,
      currentVersion,
      isLoading,
    };
  },
};
```

### 6. useXmlOperation

**Vue 2 (Mixin):**

```javascript
export default {
  mixins: [xmlOperation],
  methods: {
    deleteXml(id) {
      this.deleteXmlCuration(id, false);
    },
  },
};
```

**Vue 3 (Composable):**

```typescript
import { useXmlOperation } from '@/composables';

export default {
  setup() {
    const { deleteXmlCuration, isOwner, editCuration } = useXmlOperation();

    const deleteXml = (id: string) => {
      deleteXmlCuration(id, false);
    };

    return {
      deleteXml,
      isOwner,
      editCuration,
    };
  },
};
```

## Key Differences

### 1. Import Pattern

- **Vue 2:** Import mixin file and add to `mixins` array
- **Vue 3:** Import composable function and call in `setup()`

### 2. Data Access

- **Vue 2:** Access via `this.propertyName`
- **Vue 3:** Access via returned reactive references

### 3. Method Access

- **Vue 2:** Access via `this.methodName()`
- **Vue 3:** Access via destructured functions

### 4. TypeScript Support

- **Vue 2:** Limited TypeScript support
- **Vue 3:** Full TypeScript support with proper typing

## Migration Checklist

When migrating a component from Vue 2 mixins to Vue 3 composables:

1. ✅ Remove `mixins` array from component
2. ✅ Import required composables
3. ✅ Call composables in `setup()` function
4. ✅ Destructure needed properties and methods
5. ✅ Return them from `setup()` for template access
6. ✅ Update template references if needed
7. ✅ Test functionality to ensure it works as expected

## Benefits of Composables

1. **Better TypeScript Support:** Full type safety and IntelliSense
2. **Tree Shaking:** Only import what you need
3. **Reusability:** Easier to share logic between components
4. **Testing:** Easier to test individual pieces of logic
5. **Performance:** Better optimization by Vue 3's reactivity system
6. **Maintainability:** Clearer separation of concerns

## Notes

- All composables maintain the same functionality as their Vue 2 mixin counterparts
- Some composables may have slight API differences for better TypeScript support
- The `useXmlOperation` composable includes the functionality of `useExplorerQueryParams` automatically
- All composables are fully typed and provide better developer experience
