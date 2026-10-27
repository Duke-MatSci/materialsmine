import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';

/**
 * Composable for paginating a list of items with responsive visible count.
 * Used by the dataset detail page to navigate distribution files.
 */
export function useFilePagination<T>(items: Ref<T[]>) {
  const startIndex = ref(0);
  const hideNavLeft = ref(true);
  const hideNavRight = ref(false);

  const getVisibleCount = (): number => {
    if (window.matchMedia('(max-width: 40.5em)').matches) return 1;
    if (window.matchMedia('(max-width: 56.25em)').matches) return 2;
    if (window.matchMedia('(max-width: 75em)').matches) return 3;
    if (window.matchMedia('(max-width: 87.5em)').matches) return 4;
    return 5;
  };

  const visibleCount = ref(getVisibleCount());

  const visibleItems = computed(() =>
    items.value.slice(startIndex.value, startIndex.value + visibleCount.value)
  );

  const updateNavVisibility = (): void => {
    const total = items.value.length;
    hideNavLeft.value = startIndex.value <= 0;
    hideNavRight.value = startIndex.value + visibleCount.value >= total;
  };

  const navigate = (direction: 'prev' | 'next'): void => {
    const total = items.value.length;
    if (direction === 'prev') {
      if (startIndex.value > 0) startIndex.value--;
    } else {
      const maxStart = Math.max(0, total - visibleCount.value);
      if (startIndex.value < maxStart) startIndex.value++;
    }
    updateNavVisibility();
  };

  const handleResize = (): void => {
    visibleCount.value = getVisibleCount();
    const total = items.value.length;
    const maxStart = Math.max(0, total - visibleCount.value);
    if (startIndex.value > maxStart) startIndex.value = maxStart;
    updateNavVisibility();
  };

  onMounted(() => {
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  return {
    startIndex,
    visibleCount,
    visibleItems,
    hideNavLeft,
    hideNavRight,
    navigate,
    updateNavVisibility,
  };
}
